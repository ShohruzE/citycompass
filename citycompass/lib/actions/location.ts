export function inferBoroughFromZip(zipCode: string): string | null {
  const zip = parseInt(zipCode, 10);

  // Manhattan: 100xx, 102xx
  if (zip >= 10001 && zip <= 10282) {
    return "Manhattan";
  }

  // Bronx: 104xx
  if (zip >= 10451 && zip <= 10475) {
    return "Bronx";
  }

  // Brooklyn: 112xx
  if (zip >= 11201 && zip <= 11256) {
    return "Brooklyn";
  }

  // Queens: 110xx, 113xx-114xx, 116xx
  if ((zip >= 11001 && zip <= 11109) || (zip >= 11351 && zip <= 11499) || (zip >= 11690 && zip <= 11697)) {
    return "Queens";
  }

  // Staten Island: 103xx
  if (zip >= 10301 && zip <= 10314) {
    return "Staten Island";
  }

  return null;
}
