module.exports = function decodeBase64Url(encodedStr) {
  if (!encodedStr) return "";
  encodedStr = encodedStr.replace(/-/g, "+").replace(/_/g, "/");
  while (encodedStr.length % 4) {
    encodedStr += "=";
  }
  return Buffer.from(encodedStr, "base64").toString("utf-8");
};
