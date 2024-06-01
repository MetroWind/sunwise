// Use OpenStreetMap’s Noninatim and Open Meteo as data source.

async function coordsToLocationName(coords)
{
    const res_geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=geocodejson`);
    const json_geo = await res_geo.json();
    return json_geo.features[0].properties.geocoding.city;
}

// Return an object that has property “latitude” and “longitude”.
async function cityToCoords(name)
{
    const res_geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${name}&count=1&language=en&format=json`);
    const json_geo = await res_geo.json();
    return json_geo.results[0];
}

function weatherFromJSON(json, city)
{
    let data = new WeatherDataSet();
    data.location_name = city;
    data.time_zone = json.timezone;
    data.utc_offset_s = json.utc_offset_seconds;
    let offset_str = data.utcOffsetStr();
    data.current_weather = new Weather();
    console.debug(`Parsing time: ${json.current.time + offset_str}`);
    data.current_weather.time = new Date(json.current.time + offset_str);
    console.debug(`Parssed timezone: ${data.current_weather.time.getTimezoneOffset()}`);
    data.current_weather.temperature_cel = Math.round(json.current.temperature_2m);
    data.current_weather.condition = json.current.weather_code;
    let tomorrow = new Date(data.current_weather.time.getTime() +
                            24 * 3600 * 1000);
    if(json.hourly !== undefined)
    {
        for(var i = 0; i < json.hourly.time.length; i++)
        {
            let time = new Date(json.hourly.time[i] + offset_str);
            if(time < data.current_weather.time || time >= tomorrow)
            {
                continue;
            }
            let weather = new Weather();
            weather.temperature_cel = Math.round(json.hourly.temperature_2m[i]);
            weather.condition = json.hourly.weather_code[i];
            weather.time = time;
            data.forecast_hours.push(weather);
        }
    }
    let ten_days_later = new Date(data.current_weather.time.getTime() +
                                  10 * 24 * 3600 * 1000);
    if(json.daily !== undefined)
    {
        for(var i = 0; i < json.daily.time.length; i++)
        {
            let time = new Date(json.daily.time[i] + "T00:00:00" + offset_str);
            if(data.current_weather.time - time >= 24 * 3600 * 1000
               || time >= ten_days_later)
            {
                continue;
            }
            let weather = new Weather();
            weather.temperature_cel_min = Math.round(json.daily.temperature_2m_min[i]);
            weather.temperature_cel_max = Math.round(json.daily.temperature_2m_max[i]);
            weather.condition = json.daily.weather_code[i];
            weather.time = time;
            data.forecast_days.push(weather);
        }
    }
    return data;
}

async function getCurrentWeatherFromCoords(coords)
{
    const city = await coordsToLocationName(coords);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code`)
    const json_weather = await res_weather.json();
    return weatherFromJSON(json_weather, city);
}

async function getCurrentWeatherFromCity(city)
{
    const coords = await cityToCoords(city);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code`)
    const json_weather = await res_weather.json();
    return weatherFromJSON(json_weather, city);
}

async function getDetailedWeatherFromCoords(coords)
{
    const city = await coordsToLocationName(coords);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min`);
    const json_weather = await res_weather.json();
    return weatherFromJSON(json_weather, city);
}

async function getDetailedWeatherFromCity(city)
{
    const coords = await cityToCoords(city);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min`);
    const json_weather = await res_weather.json();
    console.debug(json_weather);
    return weatherFromJSON(json_weather, city);
}
