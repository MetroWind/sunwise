let e = React.createElement;

class AppState
{
    constructor(state)
    {
        // Can be “list”, “detail”, “search”.
        this.state = state;
        // Null location means to use current location.
        this.detail_location = null;
        this.locations = [null,];
    }
}

// Convert Date object to 24h time string.
function timeToTimeStr(t, time_zone_str)
{
    const short_time = new Intl.DateTimeFormat("en", {
        timeStyle: "short",
        hour12: false,
        timeZone: time_zone_str,
    });
    return short_time.format(t);
}

// Convert Date object to 24h hour as an integer.
function timeToHour(t, time_zone_str)
{
    const hour_format = new Intl.DateTimeFormat("en", {
        hour: "numeric",
        hour12: false,
        timeZone: time_zone_str,
    });
    return Number(hour_format.format(t));
}

function findStyleByHourWeather(hour, weather_code)
{
    console.debug(`Looking for style for ${hour}, ${weather_code}...`)
    function hourMatch(h, style)
    {
        if(style.hours.length == 0)
        {
            return true;
        }
        return h >= style.hours[0] && h < style.hours[1];
    }

    function weatherMatch(code, style)
    {
        if(style.weather_codes.length == 0)
        {
            return true;
        }
        return style.weather_codes.includes(code);
    }

    return THEME.weather.find((style) => hourMatch(hour, style) &&
                              weatherMatch(weather_code, style));
}

// Return a CSS style dict (for React components) from a style defined
// in the theme.
function styleFromThemeStyle(style_spec)
{
    if(style_spec == null)
    {
        return {};
    }
    let style = {};
    const bg = style_spec.background;
    console.debug(`BG type is ${bg.type}`);
    if(bg.type == "color")
    {
        style = {
            background: bg.color,
        };
    }
    else if(bg.type == "gradient")
    {
        style = {
            background: `linear-gradient(170deg, ${bg.color1} 0%, ${bg.color2} 100%)`,
        };
    }
    else if(bg.type == "image")
    {
        style = {
            background: `no-repeat center/cover url("${bg.url}")`,
        };
        console.debug(`BG is ${style.background}`);
    }

    if(style_spec.foreground_color != null)
    {
        style["color"] = style_spec.foreground_color;
    }
    return style;
}
// Convert Date object to week day string.
function timeToWeekDayStr(t, time_zone_str)
{
    console.debug(t);
    const time = new Intl.DateTimeFormat("en", {
        weekday: "long",
        timeZone: time_zone_str,
    });
    return time.format(t);
}

function WeatherSummaryView({location, now, onClick})
{
    // State can be “ready”, “config”, “loading”.
    const [state, setState] = React.useState("loading");
    const [data, setData] = React.useState(null);

    if(state == "loading")
    {
        if(location == null)
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
            getCurrentWeatherFromLocation(location).then((weather_data) => {
                setData(weather_data);
                setState("ready");
            });
        }
        return e("div", {}, "loading...");
    }
    else if(state == "ready")
    {
        const hour = timeToHour(data.current_weather.time, data.time_zone);
        const style_spec =
              findStyleByHourWeather(hour, data.current_weather.condition);
        let style = styleFromThemeStyle(style_spec);
        return e("li", {key: location, style: style,
                        onClick: () => onClick(location)},
                 e("div", {className: "SummaryLeft"},
                   e("div", {className: "SummaryLocation"}, data.location_name),
                   e("div", {className: "SummaryTime"},
                     timeToTimeStr(now, data.time_zone)),
                   e("div", {className: "SummaryCondition"},
                     weatherCodeToStr(data.current_weather.condition))),
                 e("div", {className: "SummaryTemp"},
                   `${data.current_weather.temperature_cel}°C`));
    }
}

function WeatherListView({locations, onClickLocation})
{
    const now = Date.now();
    // Here we pass “now” into each list element, to ensure that the
    // user sees the same time across all locations.
    const sub_views = locations.map((loc) =>
        e(WeatherSummaryView,
          {location: loc, now: now, onClick: onClickLocation}));

    return e("ul", {id: "WeatherList"}, sub_views);
}

function WeatherDetailView({location})
{
    // State can be “loading” or “ready”.
    const [state, setState] = React.useState("loading");
    const [data, setData] = React.useState(null);

    let style = styleFromThemeStyle(THEME.app);
    if(data != null)
    {
        const style_spec = findStyleByHourWeather(
            timeToHour(Date.now(), data.time_zone),
            data.current_weather.condition);
        console.debug(`Found style: ${JSON.stringify(style_spec, null, 2)}`);
        style = styleFromThemeStyle(style_spec);
    }

    if(state == "loading")
    {
        if(location == null)
        {
            navigator.geolocation.getCurrentPosition((loc) => {
                getDetailedWeatherFromCoords(loc.coords).then((weather_data) => {
                    setData(weather_data);
                    setState("ready");
                });
            }, null, {maximumAge: 5 * 60 * 1000});
        }
        else
        {
            getDetailedWeatherFromLocation(location).then((weather_data) => {
                setData(weather_data);
                setState("ready");
            });
        }
        return e("div", {}, "loading...");
    }
    else if(state == "ready")
    {
        let i = 0;
        const hourlies = data.forecast_hours.map((weather, i) =>
            e("li", {className: "DetailHourlyChild", key: i},
              e("div", {className: "DetailHourlyCondition"},
                weatherCodeToIcon(weather.condition)),
              e("div", {className: "DetailHourlyTemp"},
                `${weather.temperature_cel}°C`),
              e("div", {className: "DetailHourlyTime"},
                timeToTimeStr(weather.time, data.time_zone))));

        const dailies = data.forecast_days.map((weather, i) =>
            e("li", {className: "DetailDailyChild", key: i},
              e("div", {className: "DetailDailyWeekday"},
                timeToWeekDayStr(weather.time, data.time_zone)),
              e("div", {className: "DetailDailyCondition"},
                weatherCodeToIcon(weather.condition)),
              e("div", {className: "DetailDailyTempMax"},
                `${weather.temperature_cel_max}°C`),
              e("div", {className: "DetailDailyTempMin"},
                `${weather.temperature_cel_min}°C`)));

        let time_str = timeToTimeStr(data.current_weather.time, data.time_zone);
        return e("div", {id: "DetailView", style: style},
                 e("div", {id: "DetailCurrent"},
                   e("div", {id: "DetailCurrentTemp"},
                     e("span", {id: "DetailCurrentTempValue"},
                       `${data.current_weather.temperature_cel}`),
                     e("span", {id: "DetailCurrentTempUnit"}, "°C")),
                   e("div", {id: "DetailCurrentCondition"},
                     weatherCodeToStr(data.current_weather.condition)),
                   e("div", {id: "DetailCurrentTime"}, `as of ${time_str}`)),
                 e("ul", {id: "DetailHourly"}, hourlies),
                 e("ul", {id: "DetailDaily"}, dailies));
    }
}

function SearchView({ onChange, onClickSearchResult })
{
    const [term, setTerm] = React.useState("");
    const [results, setResults] = React.useState([]);

    function onTermChange(e)
    {
        const term = e.target.value;
        setTerm(term);
        onChange(term);
        if(term.length < 3)
        {
            return;
        }
        searchLocation(term).then((search_results) => {
            setResults(search_results);
        });
    }

    function onClickResult(loc)
    {
        setTerm("");
        setResults([]);
        onClickSearchResult(loc);
    }

    let result_views = results.map((loc, i) =>
        e("li", {key: i, className: "SearchResult",
                 onClick: () => onClickResult(loc)}, loc.str()));
    let results_style = {};

    if(term.length < 3)
    {
        results_style = { display: "none" };
    }

    return e("div", { id: "SearchWrapper" },
             e("div", {id: "SearchBar" },
               e("input", { id: "TextSearch", type: "search",
                            onChange: onTermChange, value: term})),
             e("ul", { id: "SearchResults", style: results_style },
               result_views));
}

function AppView({locations})
{
    let initial_state = new AppState("list");
    initial_state.locations = locations;
    const [state, setState] = React.useState(initial_state);

    function onClickLocation(loc)
    {
        let new_state = structuredClone(state);
        new_state.state = "detail";
        new_state.detail_location = loc;
        setState(new_state);
        // history.pushState(null, null, "#" + loc);
    }

    function onClickSearchResult(loc)
    {
        console.debug(`Clicked on ${loc.str()}`);
        let new_state = structuredClone(state);
        new_state.state = "list";
        new_state.locations.push(loc);
        setState(new_state);
        saveLocations(new_state.locations);
    }

    function onSearchTermChange(term)
    {
        if(term.length > 0)
        {
            let new_state = structuredClone(state);
            new_state.state = "search";
            setState(new_state);
        }
        else
        {
            let new_state = structuredClone(state);
            new_state.state = "list";
            setState(new_state);
        }
    }

    let content = null;
    if(state.state == "list")
    {
        return e("div", { id: "WeatherListWrapper",
                          style: styleFromThemeStyle(THEME.app) },
                 e(SearchView, {onChange: onSearchTermChange,
                                onClickSearchResult: onClickSearchResult}),
                 e(WeatherListView, {locations: state.locations,
                                     onClickLocation: onClickLocation}));
    }
    else if(state.state == "detail")
    {
        return e(WeatherDetailView, {location: state.detail_location});
    }
    else if(state.state == "search")
    {
        return e("div", { id: "WeatherListWrapper",
                          style: styleFromThemeStyle(THEME.app) },
                 e(SearchView, {onChange: onSearchTermChange,
                                onClickSearchResult: onClickSearchResult}));
    }
}

let body = ReactDOM.createRoot(document.getElementById('AppWrapper'));
body.render(e(AppView, {locations: loadLocations()}));
