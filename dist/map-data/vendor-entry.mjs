// Browser bridge for the buildless atlas. The library and worker stay local.
import * as maplibregl from 'maplibre-gl';

maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
maplibregl.setWorkerCount(2);
window.maplibregl = maplibregl;
