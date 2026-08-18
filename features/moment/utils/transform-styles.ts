export const getTransformStyles = (count: number) => {
  const cappedCount = Math.min(count, 8);

  if (cappedCount === 1) return ["rotate(0deg)"];
  if (cappedCount === 2) {
    return ["rotate(-3deg) translateX(-45px)", "rotate(3deg) translateX(45px)"];
  }
  if (cappedCount === 3) {
    return ["rotate(-4deg) translateX(-90px)", "rotate(1deg)", "rotate(3deg) translateX(90px)"];
  }
  if (cappedCount === 4) {
    return [
      "rotate(-4deg) translateX(-110px)",
      "rotate(-1deg) translateX(-36px)",
      "rotate(2deg) translateX(36px)",
      "rotate(3deg) translateX(110px)",
    ];
  }
  if (cappedCount === 5) {
    return [
      "rotate(4deg) translateX(-120px)",
      "rotate(-2deg) translateX(-58px)",
      "rotate(-3deg)",
      "rotate(3deg) translateX(58px)",
      "rotate(-5deg) translateX(118px)",
    ];
  }
  if (cappedCount === 6) {
    return [
      "rotate(4deg) translateX(-125px)",
      "rotate(-3deg) translateX(-75px)",
      "rotate(-1deg) translateX(-25px)",
      "rotate(2deg) translateX(25px)",
      "rotate(-4deg) translateX(75px)",
      "rotate(3deg) translateX(125px)",
    ];
  }
  if (cappedCount === 7) {
    return [
      "rotate(-4deg) translateX(-132px)",
      "rotate(2deg) translateX(-88px)",
      "rotate(-2deg) translateX(-44px)",
      "rotate(1deg)",
      "rotate(-3deg) translateX(44px)",
      "rotate(3deg) translateX(88px)",
      "rotate(-5deg) translateX(132px)",
    ];
  }
  // 8 images (Capped limit)
  return [
    "rotate(4deg) translateX(-140px)",
    "rotate(-3deg) translateX(-100px)",
    "rotate(2deg) translateX(-60px)",
    "rotate(-1deg) translateX(-20px)",
    "rotate(3deg) translateX(20px)",
    "rotate(-4deg) translateX(60px)",
    "rotate(1deg) translateX(100px)",
    "rotate(-5deg) translateX(140px)",
  ];
};
