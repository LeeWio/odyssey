export const getTransformStyles = (count: number) => {
  if (count === 1) return ["rotate(0deg)"];
  if (count === 2) {
    return ["rotate(-3deg) translateX(-45px)", "rotate(3deg) translateX(45px)"];
  }
  if (count === 3) {
    return ["rotate(-4deg) translateX(-90px)", "rotate(1deg)", "rotate(3deg) translateX(90px)"];
  }
  if (count === 4) {
    return [
      "rotate(-4deg) translateX(-110px)",
      "rotate(-1deg) translateX(-36px)",
      "rotate(2deg) translateX(36px)",
      "rotate(3deg) translateX(110px)",
    ];
  }
  return [
    "rotate(4deg) translateX(-120px)",
    "rotate(-2deg) translateX(-58px)",
    "rotate(-3deg)",
    "rotate(3deg) translateX(58px)",
    "rotate(-5deg) translateX(118px)",
  ];
};
