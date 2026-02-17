import useFetchApi from "./useFetchApi";

export default function useWeatherData() {
  return useFetchApi("/api/weather");
}
