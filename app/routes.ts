import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/moremodels","routes/moreModels.tsx")
] satisfies RouteConfig;
