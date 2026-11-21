#!/usr/bin/env bash
set -Eeuo pipefail

: "${SERVER_PROJECT_PATH:?}" "${HEALTHCHECK_URL:?}" "${ALIYUN_REGISTRY:?}" "${ALIYUN_IMAGE:?}"
: "${ALIYUN_REGISTRY_USER:?}" "${ALIYUN_REGISTRY_PASSWORD:?}" "${WEB_LATEST_IMAGE:?}"
: "${EXPECTED_IMAGE_DIGEST:?}" "${EXPECTED_REVISION:?}"

[[ ${EXPECTED_IMAGE_DIGEST} =~ ^sha256:[0-9a-f]{64}$ ]] &&
  [[ ${EXPECTED_REVISION} =~ ^[0-9a-f]{40}$ ]] &&
  [[ ${HEALTHCHECK_URL} == https://* ]] || {
    echo "Invalid build metadata or production health check URL" >&2
    exit 1
  }

cd "${SERVER_PROJECT_PATH}"
deployment_check_storage "${ALIYUN_IMAGE}" "${EXPECTED_IMAGE_DIGEST}" "${SERVER_PROJECT_PATH}"
rollback_image="${WEB_LATEST_IMAGE%:*}:rollback"
previous_id=""
restore_on_failure=false
deployment_docker_config=""

wait_for_container() {
  local image_id="$1"
  local require_healthcheck="$2"
  local container state
  for ((attempt = 1; attempt <= 45; attempt++)); do
    container="$(docker compose ps --all --quiet web)" || return 1
    [[ -n ${container} ]] || return 1
    state="$(docker inspect --format '{{.Image}} {{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${container}")" || return 1

    if [[ ${state} == "${image_id} true healthy" ||
      ( ${require_healthcheck} == false && ${state} == "${image_id} true none" ) ]]; then
      return 0
    fi
    if [[ ${state} != "${image_id} true starting" && ${state} != "${image_id} true unhealthy" ]]; then
      echo "Web container has an unexpected image or state: ${state}" >&2
      return 1
    fi
    sleep 2
  done
  echo "Web container failed to become healthy" >&2
  return 1
}

on_exit() {
  local status=$?
  trap - EXIT
  if (( status != 0 )) && [[ ${restore_on_failure} == true ]]; then
    docker compose logs --tail=100 web || true
    if [[ -z ${previous_id} ]]; then
      echo "No previous web container was available for rollback" >&2
    elif docker tag "${previous_id}" "${WEB_LATEST_IMAGE}" &&
      docker compose up --detach --no-deps --force-recreate --pull never web &&
      wait_for_container "${previous_id}" false; then
      echo "Restored and verified previous image ${previous_id}" >&2
    else
      echo "Automatic rollback failed. The previous image is tagged ${rollback_image}." >&2
    fi
  fi
  if [[ -n ${deployment_docker_config} ]] && ! rm -rf -- "${deployment_docker_config}"; then
    echo "Could not remove the temporary Docker configuration" >&2
    status=1
  fi
  exit "${status}"
}
trap on_exit EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

# Isolate registry authentication from the production user's Docker configuration.
deployment_docker_config="$(mktemp -d)"
export DOCKER_CONFIG="${deployment_docker_config}"
# An explicit registry entry prevents automatic discovery of the user's credential helper.
printf '{"auths":{"%s":{}}}\n' "${ALIYUN_REGISTRY}" >"${DOCKER_CONFIG}/config.json"

current_container="$(docker compose ps --all --quiet web)"
if [[ -n ${current_container} ]]; then
  previous_id="$(docker inspect --format '{{.Image}}' "${current_container}")"
fi

printf '%s' "${ALIYUN_REGISTRY_PASSWORD}" |
  docker login "${ALIYUN_REGISTRY}" --username "${ALIYUN_REGISTRY_USER}" --password-stdin

# A digest pull verifies manifest identity before the Compose alias is changed.
candidate="${ALIYUN_IMAGE}@${EXPECTED_IMAGE_DIGEST}"
docker pull "${candidate}"
candidate_id="$(docker image inspect --format '{{.Id}}' "${candidate}")"
candidate_revision="$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "${candidate}")"
if [[ ${candidate_revision} != "${EXPECTED_REVISION}" ]]; then
  echo "Candidate image revision does not match the GitHub commit" >&2
  exit 1
fi

if [[ -n ${previous_id} && ${previous_id} != "${candidate_id}" ]]; then
  docker tag "${previous_id}" "${rollback_image}"
fi
restore_on_failure=true
docker tag "${candidate_id}" "${WEB_LATEST_IMAGE}"
docker compose up --detach --no-deps --force-recreate --pull never web
wait_for_container "${candidate_id}" true

# Require the public origin to serve the same revision as the healthy container.
for ((attempt = 1; attempt <= 10; attempt++)); do
  if public_revision="$(curl --fail --silent --show-error --max-time 8 "${HEALTHCHECK_URL}")" &&
    [[ ${public_revision} == "${EXPECTED_REVISION}" ]]; then
    docker compose ps web
    exit 0
  fi
  sleep 3
done
echo "Public health check did not return the deployed revision" >&2
exit 1
