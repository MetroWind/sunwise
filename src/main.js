let e = React.createElement;

class Weather
{
    constructor()
    {
        this.temperature_cel = 0;
        this.temperature_cel_max = 0;
        this.temperature_cel_min = 0;
        this.condition = "";
        this.time = 0;
    }
}

class WeatherDataSet
{
    constructor()
    {
        this.location_name = "";
        this.current_weather = null;
        this.forecast_days = [];
        this.forecast_hours = [];
    }
}

class AppState
{
    constructor()
    {
        // Can be “list”, “detail”.
        this.state = "list";
        this.detail_location = null;
    }
}

const WEATHER_CODES = {
    0: "Clear",
    1: "Mostly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Light rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight shower",
    81: "Moderate shower",
    82: "Violent shower",
    85: "Slight snow shower",
    86: "Heavy snow shower",
    95: "Thunderstorm",
    96: "Thunderstorm",
    99: "Thunderstorm",
};

function weatherCodeToStr(code)
{
    if(code in WEATHER_CODES)
    {
        return WEATHER_CODES[code];
    }
    else
    {
        return `Unknown: ${code}`;
    }
}

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

async function getCurrentWeatherFromCoords(coords)
{
    const city = await coordsToLocationName(coords);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code`)
    const json_weather = await res_weather.json();
    console.debug(json_weather);
    let data = new WeatherDataSet();
    data.location_name = city;
    data.current_weather = new Weather();
    data.current_weather.time = Date.parse(json_weather.current.time);
    data.current_weather.temperature_cel = json_weather.current.temperature_2m;
    data.current_weather.condition = weatherCodeToStr(json_weather.current.weather_code);
    return data;
}

async function getCurrentWeatherFromCity(city)
{
    const coords = await cityToCoords(city);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code`)
    const json_weather = await res_weather.json();
    console.debug(json_weather);
    let data = new WeatherDataSet();
    data.location_name = city;
    data.current_weather = new Weather();
    data.current_weather.time = Date.parse(json_weather.current.time);
    data.current_weather.temperature_cel = json_weather.current.temperature_2m;
    data.current_weather.condition = weatherCodeToStr(json_weather.current.weather_code);
    return data;
}

async function getDetailedWeatherFromCoords(coords)
{
    const city = await coordsToLocationName(coords);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min`);
    const json_weather = await res_weather.json();
    console.debug(json_weather);
    let data = new WeatherDataSet();
    data.location_name = city;
    data.current_weather = new Weather();
    data.current_weather.time = Date.parse(json_weather.current.time);
    data.current_weather.temperature_cel = json_weather.current.temperature_2m;
    data.current_weather.condition = weatherCodeToStr(json_weather.current.weather_code);
    // TODO: fill details
    return data;
}

async function getDetailedWeatherFromCity(city)
{
    const coords = await cityToCoords(city);
    const res_weather = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&timezone=auto&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min`);
    const json_weather = await res_weather.json();
    console.debug(json_weather);
    let data = new WeatherDataSet();
    data.location_name = city;
    data.current_weather = new Weather();
    data.current_weather.time = Date.parse(json_weather.current.time);
    data.current_weather.temperature_cel = json_weather.current.temperature_2m;
    data.current_weather.condition = weatherCodeToStr(json_weather.current.weather_code);
    // TODO: fill details
    return data;
}

function WeatherView({location})
{
    // State can be “ready”, “config”, “loading”.
    const [state, setState] = React.useState("loading");
    const [data, setData] = React.useState(null);

    if(state == "loading")
    {
        if(location === null)
        {
            navigator.geolocation.getCurrentPosition((loc) => {
                getCurrentWeatherFromCoords(loc.coords).then((weather_data) => {
                    setData(weather_data);
                    setState("ready");
                });
            }, null, {maximumAge: 5 * 60 * 1000});
        }
        else
        {
            getCurrentWeatherFromCity(location).then((weather_data) => {
                setData(weather_data);
                setState("ready");
            });
        }
        return e("div", {}, "loading...");
    }
    else if(state == "ready")
    {
        return e(React.Fragment, {},
                 e("div", {className: "SummaryLeft"},
                   e("div", {className: "SummaryLocation"}, data.location_name),
                   e("div", {className: "SummaryCondition"}, data.current_weather.condition)),
                 e("div", {className: "SummaryTemp"},
                   `${data.current_weather.temperature_cel}°C`));
    }
}

function WeatherListView({onClickLocation})
{


    const style = {
        background: "linear-gradient(170deg, rgba(181,226,255,1) 0%, rgba(255,198,152,1) 100%)",
    };
    const locations = ["Lexington", "Beijing"];
    const sub_views = locations.map((loc) =>
        e("li", {key: loc, style: style, onClick: () => onClickLocation(loc)}, e(WeatherView, {location: loc})));

    return e("ul", {id: "WeatherList"}, sub_views);
}

function AppView()
{
    const [state, setState] = React.useState(new AppState());
    function onClickLocation(loc)
    {
        console.debug("Clicked on " + loc);
        let new_state = new AppState();
        new_state.state = "detail";
        new_state.detail_location = loc;
        setState(new_state);
        history.pushState(null, null, "#" + loc);
    }

    if(state.state == "list")
    {
        return e(WeatherListView, {onClickLocation: onClickLocation});
    }
    else if(state.state == "detail")
    {
        return e("div", {}, "detail of " + state.detail_location);
    }
}

let body = ReactDOM.createRoot(document.getElementById('AppWrapper'));
body.render(e(AppView, {config: null}));
