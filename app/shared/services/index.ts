/*
    The order in this file can cause a ZoneAwareError. You need to import the services
    in a specific order so that all services that a given service depends on are exported
    before that given service

    TODO: Apparently barrels are no longer reccommended by Angular so we may want to remove.
    For now it is still working fine and is convinient. 
*/

export * from "./window.service";
export * from "./broadcast.service";
export * from "./portal.service";
export * from "./auth.service";

// Logging Services
export * from "./logging/logging.service";
export * from "./logging/availability.logging.service";
export * from "./logging/bot.logging.service";

export * from "./arm.service";
export * from "./urielements.service";

export * from "./rbac.service";
export * from "./server-farm-data.service"
export * from "./site.service";
export * from "./appanalysis.service";
export * from "./daas.service";
export * from "./portal-action.service";
export * from "./detector-view-state.service";
export * from "./solution-factory.service";
