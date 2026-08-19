"use strict";
/* =========================================
   FASTAPI BACKEND - RENDER
========================================= */

const API_BASE =
    "https://manshik-santulan-api.onrender.com";


/* =========================================
   HELPER
========================================= */

const $ = (id) => document.getElementById(id);


/* =========================================
   ELEMENTS
========================================= */

const form = $("predict-form");
const submitBtn = $("submit-btn");

const idle = $("idle-state");
const loading = $("loading-state");
const result = $("result-state");
const error = $("error-state");

const analytics = $("analytics");
const historyPanel = $("history-panel");

const stressInput = $("stress_level");

let lifestyleChart = null;
let historyChart = null;
let lastPrediction = null;


/* =========================================
   SHOW STATE
========================================= */

function showState(state) {

    [idle, loading, result, error].forEach((element) => {

        if (element) {
            element.classList.add("hidden");
        }

    });

    if (state) {
        state.classList.remove("hidden");
    }
}


/* =========================================
   GET VALUE
========================================= */

function getValue(id) {

    const element = $(id);

    if (!element) {
        console.error(`Element not found: ${id}`);
        return "";
    }

    return element.value;

}


/* =========================================
   THEME
========================================= */

const themeBtn = $("theme-btn");

if (themeBtn) {

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("light");

        themeBtn.textContent =
            document.body.classList.contains("light")
                ? "☀"
                : "☾";

    });

}


/* =========================================
   STRESS BUTTONS
========================================= */

document
    .querySelectorAll("#stress-buttons button")
    .forEach((button) => {

        button.addEventListener("click", () => {

            document
                .querySelectorAll("#stress-buttons button")
                .forEach((btn) => {

                    btn.classList.remove("active");

                });

            button.classList.add("active");

            if (stressInput) {
                stressInput.value =
                    button.dataset.value;
            }

        });

    });


/* =========================================
   CREATE PAYLOAD
========================================= */

function createPayload() {

    return {

        age:
            Number(
                getValue("age")
            ),

        gender:
            getValue("gender"),

        country:
            getValue("country").trim(),

        academic_level:
            getValue("academic_level"),

        most_used_platform:
            getValue("most_used_platform"),

        purpose_of_use:
            getValue("purpose_of_use"),

        avg_daily_usage_hours:
            Number(
                getValue(
                    "avg_daily_usage_hours"
                )
            ),

        daily_unlocks:
            Number(
                getValue(
                    "daily_unlocks"
                )
            ),

        study_hours:
            Number(
                getValue(
                    "study_hours"
                )
            ),

        physical_activity_hours:
            Number(
                getValue(
                    "physical_activity_hours"
                )
            ),

        sleep_hours_per_night:
            Number(
                getValue(
                    "sleep_hours_per_night"
                )
            ),

        stress_level:
            getValue("stress_level")

    };

}


/* =========================================
   RECOMMENDATIONS
========================================= */

function getRecommendations(data) {

    const recommendations = [];


    /* Sleep */

    if (data.sleep_hours_per_night < 6) {

        recommendations.push(
            "😴 Sleep: Your sleep is below 6 hours. Try to build a consistent sleep routine."
        );

    } else {

        recommendations.push(
            "😴 Sleep: Your reported sleep duration looks reasonable."
        );

    }


    /* Screen Time */

    if (data.avg_daily_usage_hours > 8) {

        recommendations.push(
            "📱 Screen Time: Consider reducing long screen sessions and taking digital breaks."
        );

    } else {

        recommendations.push(
            "📱 Screen Time: Keep taking regular breaks during long digital sessions."
        );

    }


    /* Physical Activity */

    if (data.physical_activity_hours < 0.5) {

        recommendations.push(
            "🏃 Activity: Try adding a short walk or physical activity to your daily routine."
        );

    } else {

        recommendations.push(
            "🏃 Activity: Good job maintaining some physical activity."
        );

    }


    /* Study */

    if (data.study_hours > 10) {

        recommendations.push(
            "📚 Study: Your study time is high. Schedule regular breaks to avoid burnout."
        );

    }


    /* Stress */

    if (
        data.stress_level === "High" ||
        data.stress_level === "Very High"
    ) {

        recommendations.push(
            "🧠 Stress: Your reported stress is elevated. Consider talking with someone you trust."
        );

    } else {

        recommendations.push(
            "🧠 Stress: Your reported stress level is not in the high range."
        );

    }


    return recommendations;

}


/* =========================================
   SHOW RECOMMENDATIONS
========================================= */

function showRecommendations(data) {

    const recommendations =
        getRecommendations(data);

    const container =
        $("recommendations");

    if (!container) {
        return;
    }

    container.innerHTML =
        recommendations
            .map(
                (item) =>
                    `<div class="recommendation">
                        ${item}
                    </div>`
            )
            .join("");

}


/* =========================================
   SAVE HISTORY
========================================= */

function saveHistory(data, score) {

    const history =
        JSON.parse(
            localStorage.getItem(
                "mentalHealthHistory"
            ) || "[]"
        );


    const now = new Date();


    history.unshift({

        score: score,

        stress:
            data.stress_level,

        sleep:
            data.sleep_hours_per_night,

        screen:
            data.avg_daily_usage_hours,

        date:
            now.toLocaleString(),

        shortDate:
            now.toLocaleDateString()

    });


    localStorage.setItem(
        "mentalHealthHistory",
        JSON.stringify(
            history.slice(0, 10)
        )
    );

}


/* =========================================
   GET HISTORY
========================================= */

function getHistory() {

    return JSON.parse(

        localStorage.getItem(
            "mentalHealthHistory"
        ) || "[]"

    );

}


/* =========================================
   SHOW HISTORY
========================================= */

function showHistory() {

    const list =
        $("history-list");

    if (!list) {
        return;
    }


    const history =
        getHistory();


    if (history.length === 0) {

        list.innerHTML =
            `<p style="color:var(--muted)">
                No predictions saved yet.
            </p>`;

        return;

    }


    list.innerHTML =
        history
            .map(
                (item) => `

                <div class="history-item">

                    <span>

                        ${item.date}

                        <br>

                        ${item.stress}
                        ·
                        ${item.sleep}h sleep
                        ·
                        ${item.screen}h screen

                    </span>

                    <b>

                        ${Number(
                            item.score
                        ).toFixed(2)}/10

                    </b>

                </div>

            `
            )
            .join("");

}


/* =========================================
   CHARTS
========================================= */

function createCharts(data, score) {

    if (!analytics) {
        return;
    }


    analytics.classList.remove(
        "hidden"
    );


    /* Destroy old charts */

    if (lifestyleChart) {

        lifestyleChart.destroy();

        lifestyleChart = null;

    }


    if (historyChart) {

        historyChart.destroy();

        historyChart = null;

    }


    /* Check Chart.js */

    if (typeof Chart === "undefined") {

        console.warn(
            "Chart.js is not loaded."
        );

        return;

    }


    /* =====================================
       LIFESTYLE CHART
    ===================================== */

    const lifestyleCanvas =
        $("lifestyle-chart");

    if (lifestyleCanvas) {

        lifestyleChart =
            new Chart(
                lifestyleCanvas,
                {

                    type: "bar",

                    data: {

                        labels: [

                            "Sleep",
                            "Screen",
                            "Study",
                            "Activity"

                        ],

                        datasets: [

                            {

                                label:
                                    "Hours",

                                data: [

                                    data.sleep_hours_per_night,

                                    data.avg_daily_usage_hours,

                                    data.study_hours,

                                    data.physical_activity_hours

                                ],

                                borderRadius:
                                    8

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        plugins: {

                            legend: {

                                display:
                                    false

                            }

                        },

                        scales: {

                            y: {

                                beginAtZero:
                                    true,

                                max:
                                    24

                            }

                        }

                    }

                }
            );

    }


    /* =====================================
       HISTORY CHART
    ===================================== */

    const historyCanvas =
        $("history-chart");

    if (!historyCanvas) {
        return;
    }


    const history =
        getHistory()
            .slice()
            .reverse();


    historyChart =
        new Chart(
            historyCanvas,
            {

                type: "line",

                data: {

                    labels:

                        history.length

                            ? history.map(
                                (item) =>
                                    item.shortDate
                            )

                            : ["Current"],

                    datasets: [

                        {

                            label:
                                "Wellness Score",

                            data:

                                history.length

                                    ? history.map(
                                        (item) =>
                                            item.score
                                    )

                                    : [score],

                            tension:
                                0.35,

                            fill:
                                true

                        }

                    ]

                },

                options: {

                    responsive:
                        true,

                    scales: {

                        y: {

                            min:
                                0,

                            max:
                                10

                        }

                    }

                }

            }
        );

}


/* =========================================
   DOWNLOAD REPORT
========================================= */

function downloadReport() {

    if (!lastPrediction) {

        alert(
            "Please make a prediction first."
        );

        return;

    }


    const data =
        lastPrediction.data;

    const score =
        lastPrediction.score;


    const report = `

MENTAL HEALTH SIGNAL REPORT
===========================

Predicted Wellness Score:
${Number(score).toFixed(2)} / 10


PROFILE
-------

Age:
${data.age}

Gender:
${data.gender}

Country:
${data.country}

Academic Level:
${data.academic_level}


DIGITAL HABITS
--------------

Platform:
${data.most_used_platform}

Purpose:
${data.purpose_of_use}

Screen Time:
${data.avg_daily_usage_hours} hours

Daily Unlocks:
${data.daily_unlocks}


LIFESTYLE
---------

Study:
${data.study_hours} hours

Physical Activity:
${data.physical_activity_hours} hours

Sleep:
${data.sleep_hours_per_night} hours

Stress:
${data.stress_level}


AI WELLNESS SUGGESTIONS
-----------------------

${getRecommendations(data)
    .map(
        (x) =>
            "- " + x
    )
    .join("\n")}


DISCLAIMER
----------

This tool is for educational and
informational purposes only.

It is not a medical or clinical diagnosis.

`;


    const blob =
        new Blob(
            [report],
            {
                type:
                    "text/plain"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        "mental-health-report.txt";


    document.body.appendChild(
        link
    );

    link.click();

    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


/* =========================================
   FORM SUBMIT
========================================= */

if (form) {

    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const data =
                createPayload();


            /* HTML validation */

            if (!form.checkValidity()) {

                form.reportValidity();

                return;

            }


            /* Stress validation */

            if (!data.stress_level) {

                alert(
                    "Please select a stress level."
                );

                return;

            }


            /* Disable button */

            if (submitBtn) {

                submitBtn.disabled =
                    true;

            }


            /* Loading */

            showState(
                loading
            );


            try {

                console.log(
                    "Sending data:",
                    data
                );


                console.log(
                    "API:",
                    `${API_BASE}/predict`
                );


                /* =================================
                   API REQUEST
                ================================= */

                const response =
                    await fetch(

                        `${API_BASE}/predict`,

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    data
                                )

                        }

                    );


                /* =================================
                   READ RESPONSE
                ================================= */

                let responseData;


                try {

                    responseData =
                        await response.json();

                } catch {

                    throw new Error(
                        `Server returned invalid response (${response.status}).`
                    );

                }


                console.log(
                    "API Response:",
                    responseData
                );


                /* =================================
                   API ERROR
                ================================= */

                if (!response.ok) {

                    let message =
                        `Server Error ${response.status}`;


                    if (
                        responseData &&
                        responseData.detail
                    ) {

                        message =
                            typeof responseData.detail ===
                            "string"

                                ? responseData.detail

                                : JSON.stringify(
                                    responseData.detail
                                );

                    }


                    throw new Error(
                        message
                    );

                }


                /* =================================
                   GET SCORE
                ================================= */

                const score =
                    Number(
                        responseData
                            .predicted_mental_health_score
                    );


                if (
                    !Number.isFinite(
                        score
                    )
                ) {

                    throw new Error(
                        "Prediction score is missing from API response."
                    );

                }


                /* =================================
                   KEEP SCORE 0-10
                ================================= */

                const finalScore =
                    Math.max(
                        0,
                        Math.min(
                            10,
                            score
                        )
                    );


                /* =================================
                   SCORE
                ================================= */

                const scoreElement =
                    $("score");

                if (scoreElement) {

                    scoreElement.textContent =
                        finalScore.toFixed(2);

                }


                /* =================================
                   METER
                ================================= */

                const meterFill =
                    $("meter-fill");

                if (meterFill) {

                    meterFill.style.width =
                        `${finalScore * 10}%`;

                }


                /* =================================
                   INTERPRETATION
                ================================= */

                if (finalScore < 4) {

                    $("band").textContent =
                        "Signal: Strained";


                    $("context").textContent =
                        "The model indicates a lower wellness score based on the information provided.";

                }

                else if (finalScore < 7) {

                    $("band").textContent =
                        "Signal: Balanced";


                    $("context").textContent =
                        "The model indicates a moderate wellness score based on the information provided.";

                }

                else {

                    $("band").textContent =
                        "Signal: Strong";


                    $("context").textContent =
                        "The model indicates a stronger wellness score based on the information provided.";

                }


                /* =================================
                   QUICK STATS
                ================================= */

                const sleepStat =
                    $("sleep-stat");

                if (sleepStat) {

                    sleepStat.textContent =
                        data.sleep_hours_per_night;

                }


                const screenStat =
                    $("screen-stat");

                if (screenStat) {

                    screenStat.textContent =
                        data.avg_daily_usage_hours;

                }


                const activityStat =
                    $("activity-stat");

                if (activityStat) {

                    activityStat.textContent =
                        data.physical_activity_hours;

                }


                const stressStat =
                    $("stress-stat");

                if (stressStat) {

                    stressStat.textContent =
                        data.stress_level;

                }


                /* =================================
                   INSIGHTS
                ================================= */

                const insights =
                    $("insights");

                if (insights) {

                    insights.innerHTML =
                        getRecommendations(data)
                            .map(
                                (item) =>
                                    `<div class="insight">
                                        ${item}
                                    </div>`
                            )
                            .join("");

                }


                /* =================================
                   SAVE HISTORY
                ================================= */

                saveHistory(
                    data,
                    finalScore
                );


                /* =================================
                   STORE PREDICTION
                ================================= */

                lastPrediction = {

                    data:
                        data,

                    score:
                        finalScore

                };


                /* =================================
                   CHARTS
                ================================= */

                createCharts(
                    data,
                    finalScore
                );


                /* =================================
                   RECOMMENDATIONS
                ================================= */

                showRecommendations(
                    data
                );


                /* =================================
                   SHOW RESULT
                ================================= */

                showState(
                    result
                );


                /* Scroll result into view */

                if (result) {

                    result.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "start"
                    });

                }


            }


            catch (err) {

                console.error(
                    "Prediction error:",
                    err
                );


                const errorTitle =
                    $("error-title");

                if (errorTitle) {

                    errorTitle.textContent =
                        "Prediction Failed";

                }


                const errorText =
                    $("error-text");


                let message =
                    err.message ||
                    "Unable to connect to the prediction server.";


                if (
                    message.includes(
                        "Failed to fetch"
                    )
                ) {

                    message =
                        "Unable to connect to the backend. Please try again after a few seconds.";

                }


                if (errorText) {

                    errorText.textContent =
                        message;

                }


                showState(
                    error
                );

            }


            finally {

                if (submitBtn) {

                    submitBtn.disabled =
                        false;

                }

            }

        }
    );

}


/* =========================================
   RESET
========================================= */

const resetBtn =
    $("reset-btn");


if (resetBtn) {

    resetBtn.addEventListener(
        "click",
        () => {

            if (form) {

                form.reset();

            }


            if (stressInput) {

                stressInput.value =
                    "";

            }


            document
                .querySelectorAll(
                    "#stress-buttons button"
                )
                .forEach(
                    (button) => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


            const meterFill =
                $("meter-fill");

            if (meterFill) {

                meterFill.style.width =
                    "0%";

            }


            const score =
                $("score");

            if (score) {

                score.textContent =
                    "0.00";

            }


            if (analytics) {

                analytics.classList.add(
                    "hidden"
                );

            }


            showState(
                idle
            );


            window.scrollTo({

                top:
                    0,

                behavior:
                    "smooth"

            });

        }
    );

}


/* =========================================
   RETRY
========================================= */

const retryBtn =
    $("retry-btn");


if (retryBtn) {

    retryBtn.addEventListener(
        "click",
        () => {

            showState(
                idle
            );

        }
    );

}


/* =========================================
   DOWNLOAD REPORT
========================================= */

const reportBtn =
    $("report-btn");


if (reportBtn) {

    reportBtn.addEventListener(
        "click",
        downloadReport
    );

}


/* =========================================
   HISTORY
========================================= */

const historyBtn =
    $("history-btn");


if (historyBtn) {

    historyBtn.addEventListener(
        "click",
        () => {

            if (historyPanel) {

                historyPanel
                    .classList
                    .toggle(
                        "hidden"
                    );

                showHistory();

                historyPanel
                    .scrollIntoView({
                        behavior:
                            "smooth"
                    });

            }

        }
    );

}


/* =========================================
   CLOSE HISTORY
========================================= */

const historyClose =
    $("history-close");


if (historyClose) {

    historyClose.addEventListener(
        "click",
        () => {

            if (historyPanel) {

                historyPanel
                    .classList
                    .add(
                        "hidden"
                    );

            }

        }
    );

}


/* =========================================
   CLEAR HISTORY
========================================= */

const historyClear =
    $("history-clear");


if (historyClear) {

    historyClear.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "mentalHealthHistory"
            );


            showHistory();


            if (historyChart) {

                historyChart.destroy();

                historyChart =
                    null;

            }

        }
    );

}


/* =========================================
   START APPLICATION
========================================= */

showState(
    idle
);


console.log(
    "================================="
);

console.log(
    "Mental Health frontend loaded."
);

console.log(
    "FastAPI Backend:",
    API_BASE
);

console.log(
    "Prediction Endpoint:",
    `${API_BASE}/predict`
);

console.log(
    "================================="
);