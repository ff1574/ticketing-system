module.exports = function getFormattedDate() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const now = new Date();
  const dayName = days[now.getUTCDay()];
  const day = String(now.getUTCDate()).padStart(2, "0");
  const monthName = months[now.getUTCMonth()];
  const year = now.getUTCFullYear();

  const hours = String(now.getUTCHours()).padStart(2, "0");
  const minutes = String(now.getUTCMinutes()).padStart(2, "0");
  const seconds = String(now.getUTCSeconds()).padStart(2, "0");

  const time = `${hours}:${minutes}:${seconds} +0000`;

  return `${dayName}, ${day} ${monthName} ${year} ${time}`;
}
