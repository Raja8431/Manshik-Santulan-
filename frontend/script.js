"use strict";


/* =========================================
   FASTAPI BACKEND
========================================= */

const API_BASE =
    "https://manshik-santulan-api.onrender.com";



/* =========================================
   HELPER
========================================= */

const $ = (id) =>
    document.getElementById(id);



/* =========================================
   ELEMENTS
========================================= */

const form =
    $("predict-form");

const submitBtn =
    $("submit-btn");

const idle =
    $("idle-state");

const loading =
    $("loading-state");

const result =
    $("result-state");

const error =
    $("error-state");

const analytics =
    $("analytics");

const historyPanel =
    $("history-panel");

const stressInput =
    $("stress_level");


let lifestyleChart = null;

let historyChart = null;

let lastPrediction = null;



/* =========================================
   SHOW STATE
========================================= */

function showState(state) {

    [
        idle,
        loading,
        result,
        error
    ].forEach((element) => {

        element.classList.add("hidden");

    });


    state.classList.remove("hidden");

}



/* =========================================
   GET VALUE
========================================= */

function getValue(id) {

    return $(id).value;

}



/* =========================================
   THEME
========================================= */

$("theme-btn").addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );


        $("theme-btn").textContent =
            document.body.classList.contains("light")
                ? "☀"
                : "☾";

    }
);



/* =========================================
   STRESS BUTTON
========================================= */

document
    .querySelectorAll(
        "#stress-buttons button"
    )
    .forEach((button) => {


        button.addEventListener(
            "click",
            () => {


                document
                    .querySelectorAll(
                        "#stress-buttons button"
                    )
                    .forEach((btn) => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                stressInput.value =
                    button.dataset.value;

            }
        );

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
            getValue(
                "most_used_platform"
            ),

        purpose_of_use:
            getValue(
                "purpose_of_use"
            ),

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
            getValue(
                "stress_level"
            )

    };

}



/* =========================================
   AI RECOMMENDATIONS
========================================= */

function getRecommendations(data) {

    const recommendations = [];


    if (
        data.sleep_hours_per_night < 6
    ) {

        recommendations.push(
            "😴 Sleep: Your sleep is below 6 hours. Try to build a consistent sleep routine."
        );

    }

    else {

        recommendations.push(
            "😴 Sleep: Your reported sleep duration looks reasonable."
        );

    }



    if (
        data.avg_daily_usage_hours > 8
    ) {

        recommendations.push(
            "📱 Screen Time: Consider reducing long screen sessions and taking digital breaks."
        );

    }

    else {

        recommendations.push(
            "📱 Screen Time: Keep taking regular breaks during long digital sessions."
        );

    }



    if (
        data.physical_activity_hours < 0.5
    ) {

        recommendations.push(
            "🏃 Activity: Try adding a short walk or physical activity to your daily routine."
        );

    }



    if (
        data.study_hours > 10
    ) {

        recommendations.push(
            "📚 Study: Your study time is high. Schedule regular breaks to avoid burnout."
        );

    }



    if (
        data.stress_level === "High" ||
        data.stress_level === "Very High"
    ) {

        recommendations.push(
            "🧠 Stress: Your reported stress is elevated. Consider talking with someone you trust."
        );

    }


    return recommendations;

}



/* =========================================
   SHOW RECOMMENDATIONS
========================================= */

function showRecommendations(data) {

    const list =
        getRecommendations(data);


    $("recommendations").innerHTML =
        list
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


    const now =
        new Date();


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
   HISTORY DISPLAY
========================================= */

function showHistory() {

    const list =
        $("history-list");


    const history =
        getHistory();


    if (
        history.length === 0
    ) {

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

function createCharts(
    data,
    score
) {

    analytics.classList.remove(
        "hidden"
    );


    if (
        lifestyleChart
    ) {

        lifestyleChart.destroy();

    }


    if (
        historyChart
    ) {

        historyChart.destroy();

    }



    /* Lifestyle Chart */

    lifestyleChart =
        new Chart(
            $("lifestyle-chart"),
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

                            display: false

                        }

                    },

                    scales: {

                        y: {

                            beginAtZero: true,

                            max: 24

                        }

                    }

                }

            }
        );



    /* History Chart */

    const history =
        getHistory()
            .slice()
            .reverse();


    historyChart =
        new Chart(
            $("history-chart"),
            {

                type: "line",

                data: {

                    labels:

                        history.length

                            ? history.map(
                                x =>
                                    x.shortDate
                            )

                            : ["Current"],


                    datasets: [

                        {

                            label:
                                "Wellness Score",

                            data:

                                history.length

                                    ? history.map(
                                        x =>
                                            x.score
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

                    responsive: true,

                    scales: {

                        y: {

                            min: 0,

                            max: 10

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

    if (
        !lastPrediction
    ) {

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
        x => "- " + x
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


    link.href = url;

    link.download =
        "mental-health-report.txt";


    link.click();


    URL.revokeObjectURL(
        url
    );

}



/* =========================================
   FORM SUBMIT
========================================= */

form.addEventListener(
    "submit",
    async (event) => {


        event.preventDefault();


        const data =
            createPayload();


        /* HTML validation */

        if (
            !form.checkValidity()
        ) {

            form.reportValidity();

            return;

        }


        /* Stress validation */

        if (
            !data.stress_level
        ) {

            alert(
                "Please select a stress level."
            );

            return;

        }


        /* Loading */

        submitBtn.disabled =
            true;


        showState(
            loading
        );


        try {


            console.log(
                "Sending:",
                data
            );


            const response =
                await fetch(

                    `${API_BASE}/predict`,

                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                data
                            )

                    }

                );


            const responseData =
                await response.json();


            console.log(
                "API Response:",
                responseData
            );


            if (
                !response.ok
            ) {

                throw new Error(

                    responseData.detail

                        ? JSON.stringify(
                            responseData.detail
                        )

                        : `Server Error ${response.status}`

                );

            }


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
                    "Prediction score missing."
                );

            }


            /* Keep score 0-10 */

            const finalScore =
                Math.max(
                    0,
                    Math.min(
                        10,
                        score
                    )
                );


            /* Score */

            $("score")
                .textContent =
                finalScore.toFixed(
                    2
                );


            /* Meter */

            $("meter-fill")
                .style.width =
                `${finalScore * 10}%`;



            /* Interpretation */

            if (
                finalScore < 4
            ) {

                $("band")
                    .textContent =
                    "Signal: Strained";


                $("context")
                    .textContent =
                    "The model indicates a lower wellness score based on the information provided.";

            }


            else if (
                finalScore < 7
            ) {

                $("band")
                    .textContent =
                    "Signal: Balanced";


                $("context")
                    .textContent =
                    "The model indicates a moderate wellness score based on the information provided.";

            }


            else {

                $("band")
                    .textContent =
                    "Signal: Strong";


                $("context")
                    .textContent =
                    "The model indicates a stronger wellness score based on the information provided.";

            }



            /* Quick Stats */

            $("sleep-stat")
                .textContent =
                data.sleep_hours_per_night;


            $("screen-stat")
                .textContent =
                data.avg_daily_usage_hours;


            $("activity-stat")
                .textContent =
                data.physical_activity_hours;


            $("stress-stat")
                .textContent =
                data.stress_level;



            /* Insights */

            $("insights")
                .innerHTML =
                getRecommendations(
                    data
                )
                    .map(
                        item =>
                            `<div class="insight">
                                ${item}
                            </div>`
                    )
                    .join("");



            /* Save */

            saveHistory(
                data,
                finalScore
            );


            /* Store */

            lastPrediction = {

                data:
                    data,

                score:
                    finalScore

            };



            /* Charts */

            createCharts(
                data,
                finalScore
            );


            /* Recommendations */

            showRecommendations(
                data
            );


            /* Show result */

            showState(
                result
            );


        }


        catch (error) {


            console.error(
                error
            );


            $("error-title")
                .textContent =
                "Prediction Failed";


            $("error-text")
                .textContent =
                `${error.message}. Make sure FastAPI is running on port 51079.`;


            showState(
                error
            );

        }


        finally {

            submitBtn.disabled =
                false;

        }

    }
);



/* =========================================
   RESET
========================================= */

$("reset-btn")
    .addEventListener(
        "click",
        () => {


            form.reset();


            stressInput.value =
                "";


            document
                .querySelectorAll(
                    "#stress-buttons button"
                )
                .forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


            $("meter-fill")
                .style.width =
                "0%";


            $("score")
                .textContent =
                "0.00";


            showState(
                idle
            );


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }
    );



/* =========================================
   RETRY
========================================= */

$("retry-btn")
    .addEventListener(
        "click",
        () => {

            showState(
                idle
            );

        }
    );



/* =========================================
   DOWNLOAD
========================================= */

$("report-btn")
    .addEventListener(
        "click",
        downloadReport
    );



/* =========================================
   HISTORY
========================================= */

$("history-btn")
    .addEventListener(
        "click",
        () => {


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
    );



$("history-close")
    .addEventListener(
        "click",
        () => {

            historyPanel
                .classList
                .add("hidden");

        }
    );



$("history-clear")
    .addEventListener(
        "click",
        () => {


            localStorage.removeItem(
                "mentalHealthHistory"
            );


            showHistory();


            if (
                historyChart
            ) {

                historyChart.destroy();

            }

        }
    );



/* =========================================
   START
========================================= */

showState(
    idle
);


console.log(
    "Mental Health frontend loaded."
);


console.log(
    "FastAPI:",
    API_BASE
);