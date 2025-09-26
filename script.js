        // Initialize the map centered on India
        const map = L.map('map').setView([22.5937, 79.9629], 5);
        
        // Add tile layer with a light theme
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 20
        }).addTo(map);
        
        // Accident data by year and zone
        const accidentData = {
            years: [2020, 2021, 2022, 2023, 2024],
            red: [495, 450, 518, 585, 473],
            yellow: [275, 250, 288, 325, 263],
            orange: [220, 200, 230, 260, 210],
            blue: [110, 100, 115, 130, 105]
        };
        
        // Zone data with coordinates and radius for circles
        const zones = [
            {
                id: 1,
                name: "Red Zone - High Risk",
                color: "red",
                description: "Assam's flood plains, Bihar, parts of Uttar Pradesh",
                circles: [
                    {center: [26.5, 94.0], radius: 250000}, // Assam (larger)
                    {center: [25.5, 85.5], radius: 280000}, // Bihar (larger)
                    {center: [27.5, 80.5], radius: 300000}  // Uttar Pradesh (larger)
                ],
                futureData: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    projectedAccidents: [473, 500, 530, 560, 590],
                    reduction: [0, 5.7, 12.1, 18.4, 24.7]
                }
            },
            {
                id: 2,
                name: "Yellow Zone - Above-moderate",
                color: "yellow",
                description: "West Bengal (non-delta districts), Odisha",
                circles: [
                    {center: [23.5, 87.5], radius: 220000}, // West Bengal (larger)
                    {center: [20.5, 84.5], radius: 250000}  // Odisha (larger)
                ],
                futureData: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    projectedAccidents: [263, 280, 300, 320, 340],
                    reduction: [0, 6.5, 14.1, 21.7, 29.3]
                }
            },
            {
                id: 3,
                name: "Orange Zone - Moderate",
                color: "orange",
                description: "Interior Karnataka, parts of Maharashtra",
                circles: [
                    {center: [15.0, 76.5], radius: 230000}, // Karnataka (larger)
                    {center: [19.0, 76.5], radius: 260000}  // Maharashtra (larger)
                ],
                futureData: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    projectedAccidents: [210, 230, 250, 270, 290],
                    reduction: [0, 9.5, 19.0, 28.6, 38.1]
                }
            },
            {
                id: 4,
                name: "Blue Zone - Very Low Risk",
                color: "blue",
                description: "Desert areas, highlands, well-drained urban areas",
                circles: [
                    {center: [27.0, 71.0], radius: 300000}, // Rajasthan desert (larger)
                    {center: [32.0, 77.0], radius: 280000}, // Himalayas (larger)
                    {center: [28.6, 77.2], radius: 80000},  // Delhi (larger)
                    {center: [17.4, 78.5], radius: 80000},  // Hyderabad (larger)
                    {center: [12.9, 77.6], radius: 80000}   // Bangalore (larger)
                ],
                futureData: {
                    labels: ['2024', '2025', '2026', '2027', '2028'],
                    projectedAccidents: [105, 115, 125, 135, 145],
                    reduction: [0, 9.5, 19.0, 28.6, 38.1]
                }
            }
        ];
        
        // Add circles to the map for each zone
        const zoneCircles = [];
        zones.forEach(zone => {
            zone.circles.forEach(circleData => {
                // Create circle with very transparent fill
                const circle = L.circle(circleData.center, {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.2,  // More transparent
                    opacity: 0.7,
                    weight: 2,
                    radius: circleData.radius
                }).addTo(map);
                
                // Add subtle effect class
                circle.getElement().classList.add(`glow-${zone.color}`);
                
                circle.bindPopup(`<b>${zone.name}</b><br>${zone.description}`);
                
                circle.on('click', function() {
                    updateZoneInfo(zone);
                });
                
                zoneCircles.push(circle);
            });
        });
        
        // Chart variables
        let dataChart = null;
        let currentZone = null;
        let isPastView = true;
        
        // DOM elements
        const zoneName = document.getElementById('zone-name');
        const zoneDescription = document.getElementById('zone-description');
        const pastBtn = document.getElementById('past-btn');
        const futureBtn = document.getElementById('future-btn');
        const chartCanvas = document.getElementById('data-chart');
        const totalAccidents = document.getElementById('total-accidents');
        const changePercent = document.getElementById('change-percent');
        const projectedAccidents = document.getElementById('projected-accidents');
        
        // Calculate percentage change
        function calculateChange(current, previous) {
            return ((current - previous) / previous * 100).toFixed(1);
        }
        
        // Update zone information
        function updateZoneInfo(zone) {
            currentZone = zone;
            zoneName.textContent = zone.name;
            zoneDescription.textContent = zone.description;
            
            // Update stats
            const currentData = accidentData[zone.color];
            const currentYearValue = currentData[currentData.length - 1];
            const firstYearValue = currentData[0];
            const change = calculateChange(currentYearValue, firstYearValue);
            
            totalAccidents.textContent = currentYearValue;
            changePercent.textContent = `${change}%`;
            changePercent.style.color = change >= 0 ? '#ff4d4d' : '#4dff88';
            
            projectedAccidents.textContent = zone.futureData.projectedAccidents[4];
            
            // Update active button styling
            if (isPastView) {
                pastBtn.classList.add('active');
                futureBtn.classList.remove('active');
            } else {
                futureBtn.classList.add('active');
                pastBtn.classList.remove('active');
            }
            
            updateChart();
        }
        
        // Update the chart based on current zone and time view
        function updateChart() {
            if (!currentZone) return;
            
            const ctx = chartCanvas.getContext('2d');
            
            // Destroy existing chart if it exists
            if (dataChart) {
                dataChart.destroy();
            }
            
            if (isPastView) {
                // Past data chart - showing increasing trend
                const zoneData = accidentData[currentZone.color];
                
                dataChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: accidentData.years,
                        datasets: [
                            {
                                label: 'Actual Accidents',
                                data: zoneData,
                                borderColor: currentZone.color === 'red' ? '#ff4d4d' :
                                           currentZone.color === 'yellow' ? '#ffd24d' :
                                           currentZone.color === 'orange' ? '#ffa64d' :
                                           '#4db8ff',
                                backgroundColor: currentZone.color === 'red' ? 'rgba(255, 77, 77, 0.1)' :
                                              currentZone.color === 'yellow' ? 'rgba(255, 210, 77, 0.1)' :
                                              currentZone.color === 'orange' ? 'rgba(255, 166, 77, 0.1)' :
                                              'rgba(77, 184, 255, 0.1)',
                                borderWidth: 4,
                                tension: 0.3,
                                fill: true,
                                pointBackgroundColor: 'white',
                                pointBorderColor: currentZone.color,
                                pointBorderWidth: 2,
                                pointRadius: 6,
                                pointHoverRadius: 8
                            },
                            {
                                label: 'Trend Line',
                                data: zoneData.map((val, idx) => {
                                    // Create an increasing trend line
                                    const base = zoneData[0];
                                    const increase = (zoneData[zoneData.length-1] - zoneData[0]) / (zoneData.length-1);
                                    return base + (increase * idx);
                                }),
                                borderColor: 'rgba(100, 100, 100, 0.7)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                                pointRadius: 0,
                                fill: false,
                                tension: 0
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Accident Trend (2020-2024)',
                                color: '#333',
                                font: {
                                    size: 18,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                labels: {
                                    color: '#555',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                titleColor: '#1a2a6c',
                                bodyColor: '#333',
                                borderColor: '#1a2a6c',
                                borderWidth: 1
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    color: '#555'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#555'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            }
                        }
                    }
                });
            } else {
                // Future projection chart
                dataChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: currentZone.futureData.labels,
                        datasets: [
                            {
                                label: 'Projected Accidents',
                                data: currentZone.futureData.projectedAccidents,
                                backgroundColor: currentZone.color === 'red' ? 'rgba(255, 77, 77, 0.7)' :
                                              currentZone.color === 'yellow' ? 'rgba(255, 210, 77, 0.7)' :
                                              currentZone.color === 'orange' ? 'rgba(255, 166, 77, 0.7)' :
                                              'rgba(77, 184, 255, 0.7)',
                                borderColor: currentZone.color,
                                borderWidth: 1,
                                borderRadius: 5
                            },
                            {
                                label: 'Reduction %',
                                data: currentZone.futureData.reduction,
                                type: 'line',
                                borderColor: '#4dff88',
                                backgroundColor: 'rgba(77, 255, 136, 0.1)',
                                borderWidth: 3,
                                tension: 0.3,
                                fill: true,
                                yAxisID: 'y1',
                                pointBackgroundColor: 'white',
                                pointBorderColor: '#4dff88',
                                pointBorderWidth: 2,
                                pointRadius: 5
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Future Accident Projections',
                                color: '#333',
                                font: {
                                    size: 18,
                                    weight: 'bold'
                                }
                            },
                            legend: {
                                labels: {
                                    color: '#555',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                titleColor: '#1a2a6c',
                                bodyColor: '#333',
                                borderColor: '#1a2a6c',
                                borderWidth: 1
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Number of Accidents',
                                    color: '#555'
                                },
                                ticks: {
                                    color: '#555'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            },
                            y1: {
                                position: 'right',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Reduction %',
                                    color: '#555'
                                },
                                ticks: {
                                    color: '#555'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            },
                            x: {
                                ticks: {
                                    color: '#555'
                                },
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.1)'
                                }
                            }
                        }
                    }
                });
            }
        }
        
        // Event listeners for time filter buttons
        pastBtn.addEventListener('click', function() {
            isPastView = true;
            pastBtn.classList.add('active');
            futureBtn.classList.remove('active');
            if (currentZone) updateChart();
        });
        
        futureBtn.addEventListener('click', function() {
            isPastView = false;
            futureBtn.classList.add('active');
            pastBtn.classList.remove('active');
            if (currentZone) updateChart();
        });
        
        // Initialize with first zone selected
        updateZoneInfo(zones[0]);
