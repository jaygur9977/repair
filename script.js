

        document.addEventListener('DOMContentLoaded', function() {
            // Initialize the map
            const map = L.map('routeMap').setView([21.7679, 78.8718], 6);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            // Define route coordinates (approximate road route)
            const routeCoordinates = [
                [23.2599, 77.4126], // Bhopal
                [23.1765, 75.7885], // Ujjain
                [22.7196, 75.8577], // Indore
                [21.7645, 76.2291], // Khandwa
                [21.2787, 76.2258], // Burhanpur
                [21.0455, 75.8011], // Bhusawal
                [20.9042, 74.7749], // Dhule
                [20.0058, 73.7906], // Nashik
                [19.0760, 72.8777], // Mumbai
            ];
            
            // Create a polyline to represent the road
            const road = L.polyline(routeCoordinates, {
                color: '#5d4037',
                weight: 8,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            
            // Add a dashed center line
            const centerLine = L.polyline(routeCoordinates, {
                color: '#ffeb3b',
                weight: 2,
                opacity: 0.9,
                dashArray: '10, 10',
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            
            // Define city markers with custom icons
            const cities = [
                { name: "Bhopal, MP", coords: [23.2599, 77.4126], type: "start" },
                { name: "Indore, MP", coords: [22.7196, 75.8577], type: "mp" },
                { name: "Dhule, MH", coords: [20.9042, 74.7749], type: "mh" },
                { name: "Nashik, MH", coords: [20.0058, 73.7906], type: "mh" },
                { name: "Pune, MH", coords: [18.5204, 73.8567], type: "mh" },
                { name: "Mumbai, MH", coords: [19.0760, 72.8777], type: "end" }
            ];
            
            // Add markers to the map
            cities.forEach(city => {
                let iconClass = '';
                if (city.type === 'start') iconClass = 'start-marker';
                else if (city.type === 'end') iconClass = 'end-marker';
                else if (city.type === 'mp') iconClass = 'mp-marker';
                else if (city.type === 'mh') iconClass = 'mh-marker';
                
                const icon = L.divIcon({
                    className: iconClass,
                    iconSize: [24, 24],
                    html: ''
                });
                
                L.marker(city.coords, {icon: icon})
                    .addTo(map)
                    .bindPopup(`<b>${city.name}</b>`);
            });
            
            // Fit map to show the entire route
            map.fitBounds(road.getBounds());
            
            // Add interaction with journey points
            const journeyPoints = document.querySelectorAll('.journey-points li');
            
            journeyPoints.forEach(point => {
                point.addEventListener('click', function() {
                    // Remove active class from all points
                    journeyPoints.forEach(p => p.classList.remove('active'));
                    
                    // Add active class to clicked point
                    this.classList.add('active');
                    
                    // Get coordinates from data attributes
                    const lat = parseFloat(this.getAttribute('data-lat'));
                    const lng = parseFloat(this.getAttribute('data-lng'));
                    
                    // Pan map to the selected city
                    map.setView([lat, lng], 10);
                });
            });
            
            // Car animation functionality
            const startBtn = document.getElementById('startDrive');
            const pauseBtn = document.getElementById('pauseDrive');
            const resetBtn = document.getElementById('resetDrive');
            const carStatus = document.getElementById('carStatus');
            
            let carMarker = null;
            let animationInterval = null;
            let currentPosition = 0;
            let isPaused = false;
            
            // Create car icon
            const carIcon = L.divIcon({
                className: 'car-icon',
                iconSize: [24, 12],
                html: '<div class="car-icon"></div>'
            });
            
            // Function to calculate bearing between two points
            function calculateBearing(start, end) {
                const startLat = start[0] * Math.PI / 180;
                const startLng = start[1] * Math.PI / 180;
                const endLat = end[0] * Math.PI / 180;
                const endLng = end[1] * Math.PI / 180;
                
                const y = Math.sin(endLng - startLng) * Math.cos(endLat);
                const x = Math.cos(startLat) * Math.sin(endLat) -
                         Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
                const bearing = Math.atan2(y, x) * 180 / Math.PI;
                
                return (bearing + 360) % 360;
            }
            
            // Function to move the car along the route
            function animateCar() {
                if (currentPosition >= routeCoordinates.length - 1) {
                    clearInterval(animationInterval);
                    carStatus.textContent = "Journey completed! Arrived in Mumbai.";
                    startBtn.disabled = true;
                    pauseBtn.disabled = true;
                    return;
                }
                
                // Calculate next position
                const nextPosition = currentPosition + 0.01;
                const segmentIndex = Math.floor(nextPosition);
                const progress = nextPosition - segmentIndex;
                
                if (segmentIndex >= routeCoordinates.length - 1) {
                    currentPosition = routeCoordinates.length - 1;
                    return;
                }
                
                // Interpolate between current and next point
                const startPoint = routeCoordinates[segmentIndex];
                const endPoint = routeCoordinates[segmentIndex + 1];
                
                const lat = startPoint[0] + (endPoint[0] - startPoint[0]) * progress;
                const lng = startPoint[1] + (endPoint[1] - startPoint[1]) * progress;
                
                // Calculate bearing for car direction
                const bearing = calculateBearing(startPoint, endPoint);
                
                // Update car position
                if (carMarker) {
                    carMarker.setLatLng([lat, lng]);
                    carMarker.getElement().style.transform = `rotate(${bearing}deg)`;
                } else {
                    carMarker = L.marker([lat, lng], { 
                        icon: carIcon,
                        rotationAngle: bearing
                    }).addTo(map);
                }
                
                // Update current position
                currentPosition = nextPosition;
                
                // Update status based on location
                updateCarStatus(lat, lng);
            }
            
            // Function to update car status based on location
            function updateCarStatus(lat, lng) {
                let status = "Driving from Bhopal to Mumbai";
                
                // Check if car is near any city
                for (const city of cities) {
                    const distance = Math.sqrt(
                        Math.pow(lat - city.coords[0], 2) + 
                        Math.pow(lng - city.coords[1], 2)
                    );
                    
                    if (distance < 0.5) {
                        status = `Approaching ${city.name}`;
                        break;
                    }
                }
                
                // Special messages for start and end
                if (currentPosition < 0.1) {
                    status = "Starting journey from Bhopal";
                } else if (currentPosition > routeCoordinates.length - 1.1) {
                    status = "Approaching Mumbai - Final destination";
                }
                
                carStatus.textContent = status;
            }
            
            // Start the car animation
            startBtn.addEventListener('click', function() {
                if (animationInterval) {
                    // Resume animation
                    isPaused = false;
                    pauseBtn.textContent = "Pause";
                    pauseBtn.disabled = false;
                    carStatus.textContent = "Resuming journey...";
                } else {
                    // Start new animation
                    if (carMarker) {
                        map.removeLayer(carMarker);
                        carMarker = null;
                    }
                    
                    currentPosition = 0;
                    carStatus.textContent = "Starting journey from Bhopal...";
                    
                    animationInterval = setInterval(animateCar, 50);
                    startBtn.disabled = true;
                    pauseBtn.disabled = false;
                }
            });
            
            // Pause the car animation
            pauseBtn.addEventListener('click', function() {
                if (isPaused) {
                    // Resume
                    isPaused = false;
                    pauseBtn.textContent = "Pause";
                    carStatus.textContent = "Resuming journey...";
                } else {
                    // Pause
                    isPaused = true;
                    pauseBtn.textContent = "Resume";
                    carStatus.textContent = "Journey paused";
                }
            });
            
            // Reset the car animation
            resetBtn.addEventListener('click', function() {
                clearInterval(animationInterval);
                animationInterval = null;
                isPaused = false;
                
                if (carMarker) {
                    map.removeLayer(carMarker);
                    carMarker = null;
                }
                
                currentPosition = 0;
                startBtn.disabled = false;
                pauseBtn.disabled = true;
                pauseBtn.textContent = "Pause";
                carStatus.textContent = "Ready to start the journey from Bhopal to Mumbai";
                
                // Reset map view
                map.fitBounds(road.getBounds());
            });
        });