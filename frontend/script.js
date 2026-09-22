/* =========================================================
   MANSHIK SANTULAN
   AI Wellness Dashboard - Complete JavaScript
   ========================================================= */

const API_BASE = "https://manshik-santulan-api.onrender.com";

let latestResult = null;
let lifestyleChart = null;
let historyChart = null;
let stressChart = null;


/* =========================================================
   DOM HELPER
   ========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
});


function initializeApp() {

    setupForm();

    setupStressButtons();

    setupSimulator();

    setupTheme();

    setupHistory();

    setupButtons();

    loadHistory();

    updateWeeklySummary();

    updateDailyTip();

    showState("idle");
}


/* =========================================================
   FORM
   ========================================================= */

function setupForm() {

    const form = $("predict-form");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        await predictMentalHealth();

    });
}


/* =========================================================
   STRESS BUTTONS
   ========================================================= */

function setupStressButtons() {

    const buttons = document.querySelectorAll(
        "#stress-buttons button"
    );

    const hiddenInput = $("stress_level");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            buttons.forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            if (hiddenInput) {
                hiddenInput.value = button.dataset.value;
            }

        });

    });
}


/* =========================================================
   MAIN PREDICTION
   ========================================================= */

async function predictMentalHealth() {

    const submitButton = $("submit-btn");

    showState("loading");

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Analyzing...";
    }

    try {

        const data = collectFormData();

        const stressData = calculateStress(data);

        let apiScore;

        try {

            apiScore = await callPredictionAPI(data);

        } catch (apiError) {

            console.warn(
                "API unavailable. Using local fallback score.",
                apiError
            );

            apiScore = calculateFallbackScore(data);

        }

        const result = buildResult(
            data,
            apiScore,
            stressData
        );

        latestResult = result;

        displayResult(result);

        saveHistory(result);

        updateCharts();

        updateWeeklySummary();

    } catch (error) {

        console.error(error);

        showError(
            "Prediction Failed",
            error.message ||
            "Something went wrong. Please try again."
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "Analyze My Wellness";
        }

    }
}


/* =========================================================
   COLLECT FORM DATA
   ========================================================= */

function collectFormData() {

    return {

        age: Number($("age")?.value || 0),

        gender: $("gender")?.value || "",

        country: $("country")?.value || "",

        academic_level:
            $("academic_level")?.value || "",

        most_used_platform:
            $("most_used_platform")?.value || "",

        purpose_of_use:
            $("purpose_of_use")?.value || "",

        avg_daily_usage_hours:
            Number(
                $("avg_daily_usage_hours")?.value || 0
            ),

        daily_unlocks:
            Number(
                $("daily_unlocks")?.value || 0
            ),

        study_hours:
            Number(
                $("study_hours")?.value || 0
            ),

        physical_activity_hours:
            Number(
                $("physical_activity_hours")?.value || 0
            ),

        sleep_hours_per_night:
            Number(
                $("sleep_hours_per_night")?.value || 0
            ),

        stress_level:
            Number(
                $("stress_level")?.value || 5
            )

    };
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function callPredictionAPI(data) {

    const response = await fetch(
        `${API_BASE}/predict`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {

        throw new Error(
            `API Error: ${response.status}`
        );

    }

    const result = await response.json();

    const score =
        Number(
            result.predicted_mental_health_score
        );

    if (Number.isNaN(score)) {

        throw new Error(
            "API did not return a valid mental health score."
        );

    }

    return clamp(score, 0, 10);
}


/* =========================================================
   FALLBACK SCORE
   ========================================================= */

function calculateFallbackScore(data) {

    let score = 6;

    /* Sleep */

    if (data.sleep_hours_per_night >= 7 &&
        data.sleep_hours_per_night <= 9) {

        score += 1;

    } else if (
        data.sleep_hours_per_night < 5
    ) {

        score -= 1.5;

    } else if (
        data.sleep_hours_per_night < 7
    ) {

        score -= 0.5;

    }


    /* Physical activity */

    if (data.physical_activity_hours >= 1) {

        score += 0.7;

    } else if (
        data.physical_activity_hours < 0.25
    ) {

        score -= 0.5;

    }


    /* Study */

    if (
        data.study_hours >= 2 &&
        data.study_hours <= 6
    ) {

        score += 0.3;

    } else if (
        data.study_hours > 9
    ) {

        score -= 0.7;

    }


    /* Screen time */

    if (data.avg_daily_usage_hours > 8) {

        score -= 1;

    } else if (
        data.avg_daily_usage_hours > 6
    ) {

        score -= 0.5;

    }


    /* Unlocks */

    if (data.daily_unlocks > 150) {

        score -= 0.7;

    } else if (
        data.daily_unlocks > 100
    ) {

        score -= 0.3;

    }


    /* Stress */

    score -=
        (data.stress_level - 5) * 0.25;


    return clamp(score, 0, 10);
}


/* =========================================================
   STRESS CALCULATION
   ========================================================= */

function calculateStress(data) {

    /*
       Educational/lifestyle estimate.
       It is NOT a clinical diagnosis.
    */

    let emotional = data.stress_level;

    let academic = 5;

    let digital = 5;


    /* -----------------------------------------
       Emotional Stress
       ----------------------------------------- */

    emotional +=
        (data.sleep_hours_per_night < 6)
            ? 1.2
            : 0;

    emotional +=
        (data.physical_activity_hours < 0.5)
            ? 0.6
            : 0;

    emotional -=
        (data.physical_activity_hours >= 1)
            ? 0.5
            : 0;


    /* -----------------------------------------
       Academic Stress
       ----------------------------------------- */

    if (data.study_hours > 8) {

        academic += 2;

    } else if (data.study_hours > 6) {

        academic += 1;

    } else if (data.study_hours >= 2) {

        academic -= 0.5;

    }


    if (data.stress_level >= 7) {

        academic += 1;

    }


    /* -----------------------------------------
       Digital / Lifestyle Stress
       ----------------------------------------- */

    if (data.avg_daily_usage_hours > 8) {

        digital += 2;

    } else if (
        data.avg_daily_usage_hours > 6
    ) {

        digital += 1;

    } else if (
        data.avg_daily_usage_hours < 3
    ) {

        digital -= 0.5;

    }


    if (data.daily_unlocks > 150) {

        digital += 1.5;

    } else if (
        data.daily_unlocks > 100
    ) {

        digital += 0.8;

    }


    if (
        data.sleep_hours_per_night < 6
    ) {

        digital += 0.8;

    }


    emotional = clamp(emotional, 0, 10);

    academic = clamp(academic, 0, 10);

    digital = clamp(digital, 0, 10);


    const overall =
        emotional * 0.4 +
        academic * 0.3 +
        digital * 0.3;


    return {

        overall: Number(overall.toFixed(1)),

        emotional: Number(emotional.toFixed(1)),

        academic: Number(academic.toFixed(1)),

        digital: Number(digital.toFixed(1)),

        label: getStressLabel(overall),

        reasons: getStressReasons(
            data,
            emotional,
            academic,
            digital
        ),

        actions: getStressActions(
            data,
            emotional,
            academic,
            digital
        )

    };
}


/* =========================================================
   STRESS LABEL
   ========================================================= */

function getStressLabel(score) {

    if (score < 2.8) {

        return "Low Stress";

    }

    if (score < 5) {

        return "Mild Stress";

    }

    if (score < 7.5) {

        return "Moderate Stress";

    }

    return "High Stress";
}


/* =========================================================
   STRESS REASONS
   ========================================================= */

function getStressReasons(
    data,
    emotional,
    academic,
    digital
) {

    const reasons = [];

    if (emotional >= 7) {

        reasons.push(
            "Your reported stress level is relatively high."
        );

    }

    if (
        data.sleep_hours_per_night < 6
    ) {

        reasons.push(
            "Low sleep can reduce recovery and increase daily stress."
        );

    }

    if (academic >= 7) {

        reasons.push(
            "Your study workload may be contributing to academic pressure."
        );

    }

    if (
        data.avg_daily_usage_hours > 7
    ) {

        reasons.push(
            "High daily screen usage may contribute to digital fatigue."
        );

    }

    if (
        data.daily_unlocks > 120
    ) {

        reasons.push(
            "Frequent phone checking may be interrupting concentration."
        );

    }

    if (
        data.physical_activity_hours < 0.5
    ) {

        reasons.push(
            "Low physical activity may reduce opportunities for stress recovery."
        );

    }

    if (reasons.length === 0) {

        reasons.push(
            "Your current lifestyle inputs do not show a major stress trigger."
        );

    }

    return reasons;
}


/* =========================================================
   STRESS ACTIONS
   ========================================================= */

function getStressActions(
    data,
    emotional,
    academic,
    digital
) {

    const actions = [];

    if (
        data.sleep_hours_per_night < 7
    ) {

        actions.push(
            "Aim for a consistent 7–9 hour sleep schedule."
        );

    }

    if (
        data.avg_daily_usage_hours > 6
    ) {

        actions.push(
            "Create screen-free periods during study, meals and before sleep."
        );

    }

    if (
        data.daily_unlocks > 100
    ) {

        actions.push(
            "Turn off non-essential notifications and reduce unnecessary phone checking."
        );

    }

    if (
        data.study_hours > 8
    ) {

        actions.push(
            "Use focused study blocks with regular short breaks."
        );

    }

    if (
        data.physical_activity_hours < 0.5
    ) {

        actions.push(
            "Add a daily walk, stretching or another comfortable physical activity."
        );

    }

    actions.push(
        "Take short breathing or mindfulness breaks when you feel overloaded."
    );

    actions.push(
        "If stress feels persistent or seriously affects daily life, consider speaking with a qualified mental-health professional."
    );

    return actions;
}


/* =========================================================
   BUILD FINAL RESULT
   ========================================================= */

function buildResult(
    data,
    score,
    stress
) {

    const performance =
        score * 10;

    const band =
        getScoreBand(score);

    const context =
        getScoreContext(score);

    const priority =
        getPriority(
            data,
            stress
        );

    return {

        timestamp:
            new Date().toISOString(),

        score:
            Number(score.toFixed(2)),

        performance:
            Number(performance.toFixed(1)),

        band,

        context,

        data,

        stress,

        priority

    };
}


/* =========================================================
   SCORE BAND
   ========================================================= */

function getScoreBand(score) {

    if (score < 4) {

        return "Needs Attention";

    }

    if (score < 7) {

        return "Balanced";

    }

    if (score < 8.5) {

        return "Good";

    }

    return "Strong";
}


/* =========================================================
   SCORE CONTEXT
   ========================================================= */

function getScoreContext(score) {

    if (score < 4) {

        return "Your current inputs suggest that some lifestyle areas may need attention.";

    }

    if (score < 7) {

        return "Your overall wellness profile appears reasonably balanced, with some areas that can be improved.";

    }

    if (score < 8.5) {

        return "Your current lifestyle indicators show several positive wellness patterns.";

    }

    return "Your current inputs show a strong overall wellness pattern.";
}


/* =========================================================
   PRIORITY
   ========================================================= */

function getPriority(data, stress) {

    const priorities = [
        {
            name: "Sleep & Recovery",
            value:
                data.sleep_hours_per_night < 7
                    ? 9
                    : 3
        },

        {
            name: "Digital Balance",
            value:
                data.avg_daily_usage_hours > 6 ||
                data.daily_unlocks > 100
                    ? 8
                    : 3
        },

        {
            name: "Academic Load",
            value:
                data.study_hours > 8
                    ? 8
                    : data.study_hours > 6
                        ? 6
                        : 3
        },

        {
            name: "Emotional Stress",
            value:
                stress.emotional
        },

        {
            name: "Physical Activity",
            value:
                data.physical_activity_hours < 0.5
                    ? 7
                    : 3
        }
    ];

    priorities.sort(
        (a, b) => b.value - a.value
    );

    return priorities;
}


/* =========================================================
   DISPLAY RESULT
   ========================================================= */

function displayResult(result) {

    showState("result");


    /* Overall score */

    setText(
        "score",
        result.score.toFixed(2)
    );

    setText(
        "overall-label",
        "Mental Health Score"
    );

    setText(
        "performance-text",
        `${result.performance.toFixed(1)}%`
    );

    setText(
        "band",
        result.band
    );

    setText(
        "context",
        result.context
    );


    /* Meter */

    const meter = $("meter-fill");

    if (meter) {

        meter.style.width =
            `${result.performance}%`;

    }


    /* Lifestyle stats */

    setText(
        "sleep-stat",
        `${result.data.sleep_hours_per_night} hrs`
    );

    setText(
        "screen-stat",
        `${result.data.avg_daily_usage_hours} hrs`
    );

    setText(
        "activity-stat",
        `${result.data.physical_activity_hours} hrs`
    );

    setText(
        "stress-stat",
        `${result.data.stress_level}/10`
    );


    /* Stress */

    displayStress(result.stress);


    /* Lifestyle */

    displayLifestyle(result);


    /* Simulator */

    updateSimulator();


    /* Recommendations */

    generateRecommendations(result);


    /* Daily tip */

    updateDailyTip();

}


/* =========================================================
   DISPLAY STRESS
   ========================================================= */

function displayStress(stress) {

    setText(
        "stress-score",
        `${stress.overall}/10`
    );

    setText(
        "stress-result-label",
        stress.label
    );


    const progress =
        $("stress-progress-fill");

    if (progress) {

        progress.style.width =
            `${stress.overall * 10}%`;

    }


    setText(
        "emotional-stress",
        `${stress.emotional}/10`
    );

    setText(
        "academic-stress",
        `${stress.academic}/10`
    );

    setText(
        "digital-stress",
        `${stress.digital}/10`
    );


    renderList(
        "stress-reasons-list",
        stress.reasons
    );

    renderList(
        "stress-actions-list",
        stress.actions
    );
}


/* =========================================================
   DISPLAY LIFESTYLE
   ========================================================= */

function displayLifestyle(result) {

    const data = result.data;

    /* Recovery */

    if (
        data.sleep_hours_per_night >= 7
    ) {

        setText(
            "recovery-status",
            "Good"
        );

        setText(
            "recovery-detail",
            "Your sleep duration is within a healthy target range."
        );

    } else {

        setText(
            "recovery-status",
            "Needs Improvement"
        );

        setText(
            "recovery-detail",
            "Try to increase sleep consistency and duration."
        );

    }


    /* Digital */

    if (
        data.avg_daily_usage_hours <= 6 &&
        data.daily_unlocks <= 100
    ) {

        setText(
            "digital-status",
            "Balanced"
        );

        setText(
            "digital-detail",
            "Your reported digital usage is relatively controlled."
        );

    } else {

        setText(
            "digital-status",
            "High"
        );

        setText(
            "digital-detail",
            "Consider reducing unnecessary screen time and phone checking."
        );

    }


    /* Academic */

    if (data.study_hours <= 8) {

        setText(
            "academic-status",
            "Manageable"
        );

        setText(
            "academic-detail",
            "Your study hours appear reasonably manageable."
        );

    } else {

        setText(
            "academic-status",
            "Heavy"
        );

        setText(
            "academic-detail",
            "Consider breaks and a structured study schedule."
        );

    }


    /* Priority */

    const top =
        result.priority[0];

    setText(
        "top-priority",
        top.name
    );

    setText(
        "priority-detail",
        `This area currently has the highest improvement priority based on your inputs.`
    );


    renderList(
        "priority-list",
        result.priority
            .slice(0, 4)
            .map(
                item =>
                    `${item.name}: priority ${item.value}/10`
            )
    );
}


/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

function generateRecommendations(result) {

    const recommendations = [];

    const data = result.data;


    if (
        data.sleep_hours_per_night < 7
    ) {

        recommendations.push({
            title: "Improve Sleep",
            text:
                "Maintain a consistent sleep schedule and target 7–9 hours."
        });

    }


    if (
        data.avg_daily_usage_hours > 6
    ) {

        recommendations.push({
            title: "Reduce Screen Time",
            text:
                "Set specific screen-free periods during study and before bedtime."
        });

    }


    if (
        data.daily_unlocks > 100
    ) {

        recommendations.push({
            title: "Reduce Phone Checking",
            text:
                "Disable unnecessary notifications and keep your phone away during focused work."
        });

    }


    if (
        data.physical_activity_hours < 0.5
    ) {

        recommendations.push({
            title: "Move More",
            text:
                "Add a short walk, stretching session or other comfortable activity."
        });

    }


    if (
        data.study_hours > 8
    ) {

        recommendations.push({
            title: "Balance Study",
            text:
                "Use focused study sessions with planned breaks instead of long uninterrupted sessions."
        });

    }


    recommendations.push({
        title: "Mindfulness Break",
        text:
            "Try a few minutes of slow breathing or mindfulness when stress increases."
    });


    const container =
        $("recommendations");

    if (!container) return;

    container.innerHTML = "";

    recommendations.forEach(
        recommendation => {

            const card =
                document.createElement("div");

            card.className =
                "recommendation-card";

            card.innerHTML = `
                <div class="recommendation-icon">
                    ✓
                </div>

                <div>
                    <h4>
                        ${escapeHTML(
                            recommendation.title
                        )}
                    </h4>

                    <p>
                        ${escapeHTML(
                            recommendation.text
                        )}
                    </p>
                </div>
            `;

            container.appendChild(card);

        }
    );
}


/* =========================================================
   SIMULATOR
   ========================================================= */

function setupSimulator() {

    const inputs = [
        "sim-sleep",
        "sim-screen",
        "sim-activity"
    ];

    inputs.forEach(id => {

        const input = $(id);

        if (!input) return;

        input.addEventListener(
            "input",
            updateSimulator
        );

    });

    updateSimulator();
}


function updateSimulator() {

    const sleep =
        Number(
            $("sim-sleep")?.value || 7
        );

    const screen =
        Number(
            $("sim-screen")?.value || 5
        );

    const activity =
        Number(
            $("sim-activity")?.value || 1
        );


    setText(
        "sim-sleep-value",
        `${sleep} hrs`
    );

    setText(
        "sim-screen-value",
        `${screen} hrs`
    );

    setText(
        "sim-activity-value",
        `${activity} hrs`
    );


    let score = 7;


    if (sleep >= 7 && sleep <= 9) {

        score += 1;

    } else if (sleep < 6) {

        score -= 1.5;

    } else {

        score -= 0.5;

    }


    if (screen > 8) {

        score -= 1.2;

    } else if (screen > 6) {

        score -= 0.5;

    }


    if (activity >= 1) {

        score += 0.8;

    } else if (activity < 0.5) {

        score -= 0.5;

    }


    score =
        clamp(score, 0, 10);


    setText(
        "sim-score",
        score.toFixed(1)
    );
}


/* =========================================================
   CHARTS
   ========================================================= */

function updateCharts() {

    if (!window.Chart) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;
    }

    updateLifestyleChart();

    updateHistoryChart();

    updateStressChart();
}


/* =========================================================
   LIFESTYLE CHART
   ========================================================= */

function updateLifestyleChart() {

    const canvas =
        $("lifestyle-chart");

    if (!canvas) return;


    const data =
        latestResult?.data;

    if (!data) return;


    if (lifestyleChart) {

        lifestyleChart.destroy();

    }


    lifestyleChart =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: [
                        "Sleep",
                        "Screen Time",
                        "Study",
                        "Activity"
                    ],

                    datasets: [
                        {
                            label: "Hours",
                            data: [
                                data.sleep_hours_per_night,
                                data.avg_daily_usage_hours,
                                data.study_hours,
                                data.physical_activity_hours
                            ],

                            borderWidth: 1
                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    scales: {

                        y: {
                            beginAtZero: true
                        }

                    },

                    plugins: {

                        legend: {
                            display: false
                        }

                    }

                }

            }
        );
}


/* =========================================================
   HISTORY CHART
   ========================================================= */

function updateHistoryChart() {

    const canvas =
        $("history-chart");

    if (!canvas) return;


    const history =
        getHistory();

    if (history.length === 0) return;


    if (historyChart) {

        historyChart.destroy();

    }


    const recent =
        history.slice(-10);


    historyChart =
        new Chart(
            canvas,
            {
                type: "line",

                data: {

                    labels:
                        recent.map(
                            item =>
                                formatDate(
                                    item.timestamp
                                )
                        ),

                    datasets: [
                        {
                            label:
                                "Mental Health Score",

                            data:
                                recent.map(
                                    item =>
                                        item.score
                                ),

                            tension: 0.3,

                            fill: false,

                            borderWidth: 2

                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

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


/* =========================================================
   STRESS CHART
   ========================================================= */

function updateStressChart() {

    const canvas =
        $("stress-chart");

    if (!canvas) return;


    if (!latestResult) return;


    if (stressChart) {

        stressChart.destroy();

    }


    const stress =
        latestResult.stress;


    stressChart =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Emotional Stress",
                        "Academic Stress",
                        "Digital/Lifestyle Stress"
                    ],

                    datasets: [
                        {
                            data: [
                                stress.emotional,
                                stress.academic,
                                stress.digital
                            ],

                            borderWidth: 1

                        }
                    ]

                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false

                }

            }
        );
}


/* =========================================================
   HISTORY
   ========================================================= */

function saveHistory(result) {

    const history =
        getHistory();

    history.push(result);

    const limited =
        history.slice(-30);

    localStorage.setItem(
        "mhsHistory",
        JSON.stringify(limited)
    );
}


function getHistory() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "mhsHistory"
            )
        ) || [];

    } catch {

        return [];

    }
}


function loadHistory() {

    renderHistoryList();

    updateCharts();
}


function setupHistory() {

    const historyButton =
        $("history-btn");

    const historyPanel =
        $("history-panel");

    const closeButton =
        $("history-close");

    const clearButton =
        $("history-clear");


    if (historyButton) {

        historyButton.addEventListener(
            "click",
            () => {

                if (historyPanel) {

                    historyPanel.classList.add(
                        "open"
                    );

                }

                renderHistoryList();

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                if (historyPanel) {

                    historyPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                localStorage.removeItem(
                    "mhsHistory"
                );

                renderHistoryList();

                updateCharts();

                updateWeeklySummary();

            }
        );

    }
}


function renderHistoryList() {

    const container =
        $("history-list");

    if (!container) return;


    const history =
        getHistory();


    if (history.length === 0) {

        container.innerHTML = `
            <p class="empty-history">
                No wellness assessments yet.
            </p>
        `;

        return;
    }


    container.innerHTML = "";


    [...history]
        .reverse()
        .forEach(item => {

            const div =
                document.createElement("div");

            div.className =
                "history-item";

            div.innerHTML = `
                <div>
                    <strong>
                        ${item.score.toFixed(2)}/10
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.band
                        )}
                    </span>
                </div>

                <small>
                    ${formatDateTime(
                        item.timestamp
                    )}
                </small>
            `;

            container.appendChild(div);

        });
}


/* =========================================================
   WEEKLY SUMMARY
   ========================================================= */

function updateWeeklySummary() {

    const container =
        $("weekly-summary-content");

    if (!container) return;


    const history =
        getHistory();


    if (history.length === 0) {

        container.innerHTML = `
            <p>
                Complete your first assessment to generate your wellness summary.
            </p>
        `;

        return;
    }


    const recent =
        history.slice(-7);


    const average =
        recent.reduce(
            (sum, item) =>
                sum + item.score,
            0
        ) / recent.length;


    const stressAverage =
        recent.reduce(
            (sum, item) =>
                sum + item.stress.overall,
            0
        ) / recent.length;


    container.innerHTML = `
        <div class="summary-grid">

            <div class="summary-item">
                <strong>
                    ${average.toFixed(2)}/10
                </strong>

                <span>
                    Average Mental Health Score
                </span>
            </div>

            <div class="summary-item">
                <strong>
                    ${stressAverage.toFixed(1)}/10
                </strong>

                <span>
                    Average Stress
                </span>
            </div>

            <div class="summary-item">
                <strong>
                    ${recent.length}
                </strong>

                <span>
                    Assessments
                </span>
            </div>

        </div>
    `;
}


/* =========================================================
   DAILY TIP
   ========================================================= */

function updateDailyTip() {

    const title =
        $("daily-tip-title");

    const text =
        $("daily-tip-text");


    if (!title || !text) return;


    const tips = [

        [
            "Sleep Tip",
            "Keep your sleep and wake time consistent, even on weekends."
        ],

        [
            "Digital Tip",
            "Take short screen breaks every hour during long study sessions."
        ],

        [
            "Study Tip",
            "Break large tasks into smaller focused sessions."
        ],

        [
            "Movement Tip",
            "A short walk or stretch break can help you reset between study sessions."
        ],

        [
            "Mindfulness Tip",
            "Try slow breathing for a few minutes when you notice stress building."
        ],

        [
            "Focus Tip",
            "Keep unnecessary notifications turned off while studying."
        ]

    ];


    const index =
        new Date().getDate() %
        tips.length;


    title.textContent =
        tips[index][0];

    text.textContent =
        tips[index][1];
}


/* =========================================================
   REPORT
   ========================================================= */

function setupButtons() {

    const reportButton =
        $("report-btn");

    const resetButton =
        $("reset-btn");

    const retryButton =
        $("retry-btn");


    if (reportButton) {

        reportButton.addEventListener(
            "click",
            downloadReport
        );

    }


    if (resetButton) {

        resetButton.addEventListener(
            "click",
            resetAssessment
        );

    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            () => {

                showState("idle");

            }
        );

    }
}


function downloadReport() {

    if (!latestResult) {

        alert(
            "Please complete an assessment first."
        );

        return;
    }


    const result =
        latestResult;


    const data =
        result.data;


    const stress =
        result.stress;


    const report = `

MANSHIK SANTULAN
AI WELLNESS REPORT

========================================

MENTAL HEALTH SCORE
========================================

Overall Score: ${result.score.toFixed(2)} / 10
Performance: ${result.performance.toFixed(1)}%
Status: ${result.band}

${result.context}


STRESS ANALYSIS
========================================

Overall Stress: ${stress.overall} / 10
Status: ${stress.label}

Emotional Stress:
${stress.emotional} / 10

Academic Stress:
${stress.academic} / 10

Digital/Lifestyle Stress:
${stress.digital} / 10


LIFESTYLE
========================================

Sleep:
${data.sleep_hours_per_night} hours

Screen Time:
${data.avg_daily_usage_hours} hours

Study:
${data.study_hours} hours

Physical Activity:
${data.physical_activity_hours} hours

Daily Phone Unlocks:
${data.daily_unlocks}


WHY STRESS MAY BE HIGH
========================================

${stress.reasons
    .map(
        reason => `• ${reason}`
    )
    .join("\n")}


ACTIONS TO REDUCE STRESS
========================================

${stress.actions
    .map(
        action => `• ${action}`
    )
    .join("\n")}


TOP PRIORITIES
========================================

${result.priority
    .slice(0, 5)
    .map(
        item =>
            `• ${item.name}: ${item.value}/10`
    )
    .join("\n")}


IMPORTANT NOTE
========================================

This dashboard provides an educational wellness
estimate based on self-reported lifestyle inputs.
It is not a medical diagnosis.

If you are experiencing persistent or severe
distress, consider contacting a qualified
mental-health professional.


Generated by Manshik Santulan
Date: ${formatDateTime(result.timestamp)}

`;


    const blob =
        new Blob(
            [report],
            {
                type:
                    "text/plain;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `Manshik-Santulan-Report-${Date.now()}.txt`;


    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


/* =========================================================
   RESET
   ========================================================= */

function resetAssessment() {

    const form =
        $("predict-form");

    if (form) {

        form.reset();

    }


    const stressButtons =
        document.querySelectorAll(
            "#stress-buttons button"
        );


    stressButtons.forEach(
        button => {

            button.classList.remove(
                "active"
            );

        }
    );


    if ($("stress_level")) {

        $("stress_level").value = "5";

    }


    latestResult = null;

    showState("idle");

}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {

    const button =
        $("theme-btn");

    if (!button) return;


    const savedTheme =
        localStorage.getItem(
            "mhsTheme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    }


    button.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark-mode"
            );


            const isDark =
                document.body.classList.contains(
                    "dark-mode"
                );


            localStorage.setItem(
                "mhsTheme",
                isDark
                    ? "dark"
                    : "light"
            );

        }
    );
}


/* =========================================================
   STATE MANAGEMENT
   ========================================================= */

function showState(state) {

    const states = [
        "idle-state",
        "loading-state",
        "result-state",
        "error-state"
    ];


    states.forEach(id => {

        const element =
            $(id);

        if (!element) return;


        element.style.display =
            "none";

    });


    let target;


    switch (state) {

        case "loading":
            target = $("loading-state");
            break;

        case "result":
            target = $("result-state");
            break;

        case "error":
            target = $("error-state");
            break;

        default:
            target = $("idle-state");

    }


    if (target) {

        target.style.display =
            "block";

    }
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
    title,
    message
) {

    setText(
        "error-title",
        title
    );

    setText(
        "error-text",
        message
    );

    showState("error");
}


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.textContent =
            value;

    }
}


function renderList(
    id,
    items
) {

    const container =
        $(id);

    if (!container) return;


    container.innerHTML = "";


    items.forEach(
        item => {

            const li =
                document.createElement("li");

            li.textContent =
                item;

            container.appendChild(li);

        }
    );
}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        Math.max(
            Number(value) || 0,
            min
        ),
        max
    );
}


function formatDate(
    timestamp
) {

    const date =
        new Date(timestamp);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short"
        }
    );
}


function formatDateTime(
    timestamp
) {

    const date =
        new Date(timestamp);


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",

            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   END
   ========================================================= */