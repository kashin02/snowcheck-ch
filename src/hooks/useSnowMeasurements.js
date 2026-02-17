import useFetchApi from "./useFetchApi";

export default function useSnowMeasurements() {
  return useFetchApi("/api/snow");
}
