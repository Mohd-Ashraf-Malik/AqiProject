# AQI Backend

Backend foundation for an AQI monitoring and complaint-routing platform.

## Current capabilities

- Mobile OTP request and verification without login/signup
- Complaint registration limited to one complaint per phone number per day
- Complaint routing to the nearest AQI station fetched from external APIs and its mapped municipality
- Image upload support through Cloudinary
- Public complaint metadata endpoint for challenge options
- Nearby AQI station lookup using latitude/longitude

## Core flow

1. `POST /api/v1/otp/request`
2. `POST /api/v1/otp/verify`
3. `POST /api/v1/complaints` with `Authorization: Bearer <complaintToken>`

## Important notes

- OTP delivery currently uses a `console` provider stub so development can continue before integrating a real SMS gateway.
- Configure `GOVERNMENT_AQI_API_URL` and/or `IOT_AQI_API_URL` so station data is fetched live.
- Seed municipality mappings only. Complaints store a station snapshot, not a station document.
- Complaint image upload requires Cloudinary credentials.
