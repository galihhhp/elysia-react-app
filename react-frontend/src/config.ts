let config: { apiUrl: string; featureEditTask: boolean; featureDeleteTask: boolean } | null = null;

export const loadConfig = async () => {
  if (config !== null) return config;
  try {
    const response = await fetch("/config.json");
    const json = await response.json();
    config = {
      apiUrl: json.apiUrl || "http://localhost:3000",
      featureEditTask: json.featureEditTask === true || json.featureEditTask === "true",
      featureDeleteTask: json.featureDeleteTask === true || json.featureDeleteTask === "true",
    };
    return config;
  } catch (error) {
    config = {
      apiUrl: "http://localhost:3000",
      featureEditTask: false,
      featureDeleteTask: false,
    };
    return config;
  }
};
