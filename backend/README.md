# AQI Backend

Backend foundation for an AQI monitoring and complaint-routing platform.

## Current capabilities

- Google account verification without login/signup persistence
- Complaint registration limited to one complaint per verified email per day
- Complaint routing to the nearest AQI station fetched from WAQI and its mapped municipality
- Image upload support through Cloudinary
- Public complaint metadata endpoint for challenge options
- Nearby AQI station lookup using latitude/longitude
- Heatmap station lookup around the user's location using WAQI map bounds

## Core flow

1. `POST /api/v1/auth/google/verify`
2. `POST /api/v1/complaints` with `Authorization: Bearer <complaintToken>`
4. `GET /api/v1/stations/nearby`
5. `GET /api/v1/stations/heatmap`

## Important notes

- Set `GOOGLE_CLIENT_ID` in backend and frontend to enable Google account verification.
- Configure `WAQI_API_TOKEN` to enable live station and heatmap data.
- WAQI API docs: `https://aqicn.org/api/`
- The first municipality rollout is limited to Mumbai, Bengaluru, Pune, Hyderabad, Delhi, and Noida.
- Seed those defaults with `POST /api/v1/seed/municipalities/defaults`.
- Seed municipality mappings only. Complaints store a station snapshot, not a station document.
- Complaint image upload requires Cloudinary credentials.
