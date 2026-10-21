function getLastPart(rBody) {
    const input = rBody.npm_package_version || "0";
    try {
      if (typeof input !== "string") return "0";
      const parts = input.split(".");
      return parts.length > 0 ? parts[parts.length - 1] : "0";
    } catch (error) {
      return "0";
    }
  }
  
  module.exports = getLastPart;