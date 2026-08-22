export const getTransformStyles = (count: number) => {
  const cappedCount = Math.min(count, 8);

  if (cappedCount === 1) return ["rotate(0deg)"];

  if (cappedCount === 2) {
    return ["rotate(-4deg) translateX(-35px)", "rotate(4deg) translateX(35px)"];
  }

  if (cappedCount === 3) {
    return [
      "rotate(-5deg) translateX(-60px) translateY(2px)",
      "rotate(1deg) translateY(-4px)",
      "rotate(4deg) translateX(60px) translateY(2px)",
    ];
  }

  if (cappedCount === 4) {
    return [
      "rotate(-6deg) translateX(-75px) translateY(4px)",
      "rotate(-2deg) translateX(-26px) translateY(-3px)",
      "rotate(2deg) translateX(26px) translateY(-3px)",
      "rotate(5deg) translateX(75px) translateY(4px)",
    ];
  }

  if (cappedCount === 5) {
    return [
      "rotate(4deg) translateX(-80px)",
      "rotate(-2deg) translateX(-40px)",
      "rotate(-3deg)",
      "rotate(3deg) translateX(40px)",
      "rotate(-5deg) translateX(80px)",
    ];
  }

  if (cappedCount === 6) {
    return [
      "rotate(4deg) translateX(-85px)",
      "rotate(-3deg) translateX(-51px)",
      "rotate(-1deg) translateX(-17px)",
      "rotate(2deg) translateX(17px)",
      "rotate(-4deg) translateX(51px)",
      "rotate(3deg) translateX(85px)",
    ];
  }

  if (cappedCount === 7) {
    return [
      "rotate(-4deg) translateX(-90px)",
      "rotate(2deg) translateX(-60px)",
      "rotate(-2deg) translateX(-30px)",
      "rotate(1deg)",
      "rotate(-3deg) translateX(30px)",
      "rotate(3deg) translateX(60px)",
      "rotate(-5deg) translateX(90px)",
    ];
  }

  // 8 images (Capped limit)
  return [
    "rotate(4deg) translateX(-95px)",
    "rotate(-3deg) translateX(-68px)",
    "rotate(2deg) translateX(-41px)",
    "rotate(-1deg) translateX(-14px)",
    "rotate(3deg) translateX(14px)",
    "rotate(-4deg) translateX(41px)",
    "rotate(1deg) translateX(68px)",
    "rotate(-5deg) translateX(95px)",
  ];
};
