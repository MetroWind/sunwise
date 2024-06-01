let e = React.createElement;

class AppState
{
    constructor()
    {
        // Can be “list”, “detail”.
        this.state = "list";
        this.detail_location = null;
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
        weekday: "short",
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
                   e("div", {className: "SummaryCondition"},
                     weatherCodeToStr(data.current_weather.condition))),
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
        if(location === null)
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
            getDetailedWeatherFromCity(location).then((weather_data) => {
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
              e("div", {className: "DetailDailyCondition"},
                weatherCodeToIcon(weather.condition)),
              e("div", {className: "DetailDailyTempMax"},
                `${weather.temperature_cel_max}°C`),
              e("div", {className: "DetailDailyTempMin"},
                `${weather.temperature_cel_min}°C`),
              e("div", {className: "DetailDailyWeekday"},
                timeToWeekDayStr(weather.time, data.time_zone))));

        return e("div", {id: "DetailView", style: style},
                 e("div", {id: "DetailCurrent"},
                   e("div", {id: "DetailCurrentTemp"},
                     e("span", {id: "DetailCurrentTempValue"},
                       `${data.current_weather.temperature_cel}`),
                     e("span", {id: "DetailCurrentTempUnit"}, "°C")),
                   e("div", {id: "DetailCurrentCondition"},
                     weatherCodeToStr(data.current_weather.condition)),
                   e("div", {id: "DetailCurrentTime"},
                     `as of ${timeToTimeStr(data.current_weather.time, data.time_zone)}`),
                   e("ul", {id: "DetailHourly"}, hourlies),
                   e("ul", {id: "DetailDaily"}, dailies)));
    }
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
        return e(WeatherDetailView, {location: state.detail_location});
    }
}

let body = ReactDOM.createRoot(document.getElementById('AppWrapper'));
body.render(e(AppView, {config: null}));
