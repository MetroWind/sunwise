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

function WeatherSummaryView({location})
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
        return e(React.Fragment, {},
                 e("div", {className: "SummaryLeft"},
                   e("div", {className: "SummaryLocation"}, data.location_name),
                   e("div", {className: "SummaryCondition"},
                     weatherCodeToStr(data.current_weather.condition))),
                 e("div", {className: "SummaryTemp"},
                   `${data.current_weather.temperature_cel}°C`));
    }
}

function WeatherListView({locations, onClickLocation})
{
    const style = {
        background: "linear-gradient(170deg, rgba(181,226,255,1) 0%, rgba(255,198,152,1) 100%)",
    };
    const sub_views = locations.map((loc) =>
        e("li", {key: loc, style: style, onClick: () => onClickLocation(loc)},
          e(WeatherSummaryView, {location: loc})));

    return e("ul", {id: "WeatherList"}, sub_views);
}

function WeatherDetailView({location})
{
    // State can be “loading” or “ready”.
    const [state, setState] = React.useState("loading");
    const [data, setData] = React.useState(null);

    const style = {
        background: "linear-gradient(170deg, rgba(181,226,255,1) 0%, rgba(255,198,152,1) 100%)",
    };

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

    if(state.state == "list")
    {
        return e("div", { id: "WeatherListWrapper" },
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
        return e("div", { id: "WeatherListWrapper" },
                 e(SearchView, {onChange: onSearchTermChange,
                                onClickSearchResult: onClickSearchResult}));
    }
}

let body = ReactDOM.createRoot(document.getElementById('AppWrapper'));
body.render(e(AppView, {locations: loadLocations()}));
