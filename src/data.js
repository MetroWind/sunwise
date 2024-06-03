class Location
{
    constructor(name, province, country, coords)
    {
        this.name = name;
        this.province = province;
        this.country = country;
        this.coords = coords;
    }

    str()
    {
        return `${this.name}, ${this.province}, ${this.country}`;
    }

    toAArray()
    {
        return {name: this.name, province: this.province, country: this.country,
                coords: this.coords};
    }

    static fromAArray(json)
    {
        return new Location(json.name, json.province, json.country, json.coords);
    }
}

function saveLocations(locs)
{
    window.localStorage.setItem(
        "locations", JSON.stringify(locs.map((loc) => {
            if(loc == null)
            {
                return null;
            }
            else
            {
                return loc.toAArray();
            }
        })));
}

function loadLocations()
{
    let json_str = window.localStorage.getItem("locations");
    if(json_str == null)
    {
        console.warn("Failed to load locations.");
        return [null,];
    }
    return JSON.parse(json_str).map((o) => {
        if(o == null)
        {
            return null;
        }
        else
        {
            return Location.fromAArray(o);
        }
    });
}

class Weather
{
    constructor()
    {
        // All temperature should be integer.
        this.temperature_cel = 0;
        this.temperature_cel_max = 0;
        this.temperature_cel_min = 0;
        // The weather code
        this.condition = 0;
        // This should be a Date object.
        this.time = 0;
    }
}

class WeatherDataSet
{
    constructor()
    {
        this.location_name = "";
        this.time_zone = "GMT";
        this.utc_offset_s = 0;
        this.current_weather = null;
        this.forecast_days = [];
        this.forecast_hours = [];
    }

    // A string representing the UTC offset of the time zone. Suitable
    // to be used at the end of a ISO 8601 time string (including the
    // sign).
    utcOffsetStr()
    {
        let sign = "+";
        if(this.utc_offset_s < 0)
        {
            sign = "-";
        }

        let offset = Math.abs(this.utc_offset_s);
        const hour = Math.floor(offset / 3600);
        const min = Math.floor((offset % 3600) / 60);
        return `${sign}${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
    }
}

class ConditionRepr
{
    constructor(str, icon)
    {
        this.str = str;
        this.icon = icon;
    }
}

const WEATHER_CODES = {
    0: new ConditionRepr("Clear", "☀️"),
    1: new ConditionRepr("Mostly clear", "🌤️"),
    2: new ConditionRepr("Partly cloudy", "⛅"),
    3: new ConditionRepr("Overcast", "☁️"),
    45: new ConditionRepr("Fog", "🌫️"),
    48: new ConditionRepr("Fog", "🌫️"),
    51: new ConditionRepr("Light drizzle", "🌦️"),
    53: new ConditionRepr("Moderate drizzle", "🌧️️"),
    55: new ConditionRepr("Dense drizzle", "🌧️"),
    56: new ConditionRepr("Light freezing drizzle", "🌧️"),
    57: new ConditionRepr("Dense freezing drizzle", "🌧️"),
    61: new ConditionRepr("Light rain", "🌦️"),
    63: new ConditionRepr("Moderate rain", "🌧️"),
    65: new ConditionRepr("Heavy rain", "🌧️"),
    66: new ConditionRepr("Light freezing rain", "🌦️"),
    67: new ConditionRepr("Heavy freezing rain", "🌧️"),
    71: new ConditionRepr("Slight snow", "❄️"),
    73: new ConditionRepr("Moderate snow", "️❄️"),
    75: new ConditionRepr("Heavy snow", "❄️"),
    77: new ConditionRepr("Snow grains", "❄️️"),
    80: new ConditionRepr("Slight shower", "🌦️️"),
    81: new ConditionRepr("Moderate shower", "🌧️"),
    82: new ConditionRepr("Violent shower", "🌧️"),
    85: new ConditionRepr("Slight snow shower", "❄️"),
    86: new ConditionRepr("Heavy snow shower", "❄️"),
    95: new ConditionRepr("Thunderstorm", "⛈️"),
    96: new ConditionRepr("Thunderstorm", "⛈️"),
    99: new ConditionRepr("Thunderstorm", "⛈️"),
};

function weatherCodeToStr(code)
{
    if(code in WEATHER_CODES)
    {
        return WEATHER_CODES[code].str;
    }
    else
    {
        return `Unknown: ${code}`;
    }
}

function weatherCodeToIcon(code)
{
    if(code in WEATHER_CODES)
    {
        return WEATHER_CODES[code].icon;
    }
    else
    {
        return `❓`;
    }
}
