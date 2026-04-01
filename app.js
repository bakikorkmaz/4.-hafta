document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("fitnessForm");
    const formSection = document.getElementById("formSection");
    const resultsSection = document.getElementById("resultsSection");
    const recalculateBtn = document.getElementById("recalculateBtn");
    const downloadCsvBtn = document.getElementById("downloadCsvBtn");

    let macrosChartInstance = null;
    let currentWorkoutPlanCsvString = "Gun,Odaklanma,Egzersiz,Set_Tekrar\n";

    // Form Submit Event
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Capture input values
        const userData = {
            gender: document.getElementById("gender").value,
            age: parseInt(document.getElementById("age").value),
            height: parseInt(document.getElementById("height").value),
            weight: parseFloat(document.getElementById("weight").value),
            activity: parseFloat(document.getElementById("activity").value),
            goal: document.getElementById("goal").value
        };

        // Calculations
        const results = calculatePhysicalMetrics(userData);
        const { workoutHtml, csvData } = generateWorkoutPlan(userData, results);

        currentWorkoutPlanCsvString = csvData; // Save for CSV export

        // Render Results
        renderResults(results, workoutHtml);

        // UI transitions
        formSection.classList.add("hidden");
        resultsSection.classList.remove("hidden");
        resultsSection.classList.add("fade-in");
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Recalculate Event
    recalculateBtn.addEventListener("click", () => {
        resultsSection.classList.add("hidden");
        resultsSection.classList.remove("fade-in");
        formSection.classList.remove("hidden");
        formSection.classList.add("fade-in");
    });

    // Download CSV Event
    downloadCsvBtn.addEventListener("click", () => {
        const blob = new Blob(["\ufeff" + currentWorkoutPlanCsvString], {
            type: 'text/csv;charset=utf-8;'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "ProFit_Antrenman_Programi.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    /**
     * Calculates BMI, BMR, TDEE, Caloric Needs and Macros
     */
    function calculatePhysicalMetrics(user) {
        const heightMeters = user.height / 100;
        const bmi = user.weight / (heightMeters * heightMeters);
        
        let bmiStatus = "Normal";
        let bmiClass = "status-normal";
        
        if (bmi < 18.5) {
            bmiStatus = "Zayıf";
            bmiClass = "status-warning";
        } else if (bmi >= 25 && bmi < 30) {
            bmiStatus = "Fazla Kilolu";
            bmiClass = "status-warning";
        } else if (bmi >= 30) {
            bmiStatus = "Obez";
            bmiClass = "status-danger";
        }

        let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
        bmr = user.gender === 'male' ? bmr + 5 : bmr - 161;

        const tdee = bmr * user.activity;

        let targetCalories = Math.round(tdee);
        let proteinPerKg = 2.0; 

        if (user.goal === "cut") {
            targetCalories -= 500; 
            proteinPerKg = 2.2; 
        } else if (user.goal === "bulk") {
            targetCalories += 400; 
            proteinPerKg = 2.0;
        }

        const minCalories = user.gender === 'male' ? 1500 : 1200;
        if (targetCalories < minCalories) targetCalories = minCalories;

        const proteinGrams = Math.round(user.weight * proteinPerKg);
        const fatGrams = Math.round(user.weight * 0.9); 
        const remCal = targetCalories - (proteinGrams * 4) - (fatGrams * 9);
        const carbsGrams = Math.max(0, Math.round(remCal / 4)); 

        return {
            bmi: bmi.toFixed(1),
            bmiStatus,
            bmiClass,
            targetCalories,
            macros: {
                protein: proteinGrams,
                carbs: carbsGrams,
                fat: fatGrams
            }
        };
    }

    /**
     * Determines Workout Split and Returns both HTML and CSV string
     */
    function generateWorkoutPlan(user, metrics) {
        let programHtml = "";
        let strategy = "";
        let csvString = "Gun,Odaklanma,Egzersiz,Set_Tekrar\n";
        let splitType = "fullbody"; 
        
        if (user.activity >= 1.725 || user.goal === 'bulk') {
            splitType = "ppl";
            strategy = "Hipertrofi Odaklı: İtme/Çekme/Bacak (Bölgesel Maksimum Verim)";
        } else if (user.goal === 'cut' && user.activity >= 1.55) {
            splitType = "upper_lower";
            strategy = "Yağ Yakım & Koruma: Üst/Alt Vücut Split + Kardiyo";
        } else {
            splitType = "fullbody";
            strategy = "Temel Adaptasyon: Tüm Vücut Kompound Hareketler (Haftada 3 Gün)";
        }

        document.getElementById("programDesc").textContent = strategy;

        const templates = {
            "fullbody": [
                { day: "1. Gün", focus: "Tüm Vücut A", exercises: [
                    { name: "Barbell Squat", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Bench Press", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Barbell Row", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Plank", sets: "3 SET x Maks Süre" }
                ]},
                { day: "2. Gün", focus: "Aktif Dinlenme", isRest: true, desc: "Hafif Tempolu Yürüyüş veya Esneme" },
                { day: "3. Gün", focus: "Tüm Vücut B", exercises: [
                    { name: "Romanian Deadlift", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Overhead Press", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Lat Pulldown", sets: "3 SET x 10-12 TEKRAR" },
                    { name: "Cable Crunch", sets: "3 SET x 15 TEKRAR" }
                ]}
            ],
            "upper_lower": [
                { day: "1. Gün", focus: "Üst Vücut", exercises: [
                    { name: "Incline Dumbbell Press", sets: "4 SET x 8-10 TEKRAR" },
                    { name: "Lat Pulldown", sets: "4 SET x 8-10 TEKRAR" },
                    { name: "Dumbbell Shoulder Press", sets: "3 SET x 10-12 TEKRAR" },
                    { name: "Seated Cable Row", sets: "3 SET x 10-12 TEKRAR" }
                ]},
                { day: "2. Gün", focus: "Alt Vücut + Core", exercises: [
                    { name: "Barbell Squat", sets: "4 SET x 6-8 TEKRAR" },
                    { name: "Leg Press", sets: "3 SET x 10-12 TEKRAR" },
                    { name: "Leg Curl", sets: "3 SET x 12-15 TEKRAR" },
                    { name: "Hanging Leg Raise", sets: "3 SET x Tükeniş" }
                ]},
                { day: "3. Gün", focus: "Kardiyo & Dinlenme", isRest: true, desc: "30-40 Dk LISS Kardiyo" }
            ],
            "ppl": [
                { day: "1. Gün", focus: "İtme (Göğüs/Omuz/Arka Kol)", exercises: [
                    { name: "Barbell Bench Press", sets: "4 SET x 6-8 TEKRAR" },
                    { name: "Incline Dumbbell Press", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Overhead Press", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Triceps Rope Pushdown", sets: "3 SET x 10-12 TEKRAR" }
                ]},
                { day: "2. Gün", focus: "Çekme (Sırt/Pazu)", exercises: [
                    { name: "Lat Pulldown", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Barbell Row", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Face Pulls", sets: "3 SET x 15 TEKRAR" },
                    { name: "Barbell Biceps Curl", sets: "3 SET x 10-12 TEKRAR" }
                ]},
                { day: "3. Gün", focus: "Bacak ve Karın", exercises: [
                    { name: "Squat", sets: "4 SET x 6-8 TEKRAR" },
                    { name: "Romanian Deadlift", sets: "3 SET x 8-10 TEKRAR" },
                    { name: "Leg Extension", sets: "3 SET x 12-15 TEKRAR" },
                    { name: "Cable Crunch", sets: "3 SET x 15-20 TEKRAR" }
                ]},
                { day: "4. Gün", focus: "Dinlenme", isRest: true, desc: "Tam Dinlenme" }
            ]
        };

        const plan = templates[splitType];

        plan.forEach(day => {
            if (day.isRest) {
                // HTML
                programHtml += `<div class="workout-day"><div class="rest-day"><i class="fa-solid fa-bed"></i> <div><strong>${day.day}: ${day.focus}</strong><br><span>${day.desc}</span></div></div></div>`;
                // CSV
                csvString += `"${day.day}","${day.focus}","${day.desc}","-"\n`;
            } else {
                let exercisesHtml = "";
                day.exercises.forEach(ex => {
                    exercisesHtml += `
                        <li class="exercise-item">
                            <div class="exercise-name"><i class="fa-solid fa-play"></i> ${ex.name}</div>
                            <div class="exercise-sets">${ex.sets}</div>
                        </li>
                    `;
                    // CSV
                    csvString += `"${day.day}","${day.focus}","${ex.name}","${ex.sets}"\n`;
                });

                programHtml += `
                    <div class="workout-day">
                        <div class="day-header">
                            <div class="day-name">${day.day}</div>
                            <div class="muscle-focus">${day.focus}</div>
                        </div>
                        <ul class="exercises-list">
                            ${exercisesHtml}
                        </ul>
                    </div>
                `;
            }
        });

        return { workoutHtml, csvData: csvString };
    }

    /**
     * Updates DOM and renders Chart
     */
    function renderResults(metrics, workoutHtml) {
        const bmiEl = document.getElementById("bmiValue");
        const bmiStatusEl = document.getElementById("bmiStatus");
        const calorieEl = document.getElementById("calorieTarget");
        
        animateValue(calorieEl, 0, metrics.targetCalories, 1000);
        
        bmiEl.textContent = metrics.bmi;
        bmiStatusEl.textContent = metrics.bmiStatus;
        bmiStatusEl.className = "metric-status " + metrics.bmiClass; 

        document.getElementById("labelProtein").textContent = metrics.macros.protein;
        document.getElementById("labelCarbs").textContent = metrics.macros.carbs;
        document.getElementById("labelFat").textContent = metrics.macros.fat;

        // Render Chart.js
        renderChart(metrics.macros);

        const planContainer = document.getElementById("workoutPlan");
        planContainer.innerHTML = workoutHtml;
        
        const days = planContainer.querySelectorAll('.workout-day');
        days.forEach((day, index) => {
            day.style.opacity = "0";
            setTimeout(() => {
                day.classList.add("fade-in");
            }, 300 + (index * 150));
        });
    }

    /**
     * Renders a Donut Chart for Macros
     */
    function renderChart(macros) {
        const ctx = document.getElementById('macrosChart').getContext('2d');
        
        if (macrosChartInstance) {
            macrosChartInstance.destroy();
        }

        macrosChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Protein', 'Karbonhidrat', 'Yağ'],
                datasets: [{
                    data: [macros.protein, macros.carbs, macros.fat],
                    backgroundColor: [
                        '#00ff88', // Accent Primary
                        '#00ccff', // Accent Secondary
                        '#f59e0b'  // Warning Orange
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%',
                plugins: {
                    legend: {
                        display: false // Using custom HTML legends already
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 24, 39, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.parsed + 'g';
                            }
                        }
                    }
                }
            }
        });
    }

    // Utility for smooth number counting animation
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});
