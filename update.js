
        let musicPlaying = true;
        let draggedWindow = null;
        let dragOffset = { x: 0, y: 0 };
        let highestZIndex = 200;
        let audioContext;
        let backgroundMusic;
        let musicMuted = false;

        // Initialize everything when page loads
        window.addEventListener('load', function() {
            setTimeout(() => {
                const loadingScreen = document.getElementById('loadingScreen');
                loadingScreen.classList.add('hidden');
                
                // Initialize audio after user interaction (required by browsers)
                setTimeout(initializeAudio, 500);
            }, 2000);
        });

        function initializeAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                backgroundMusic = document.getElementById('backgroundMusic');
                
                // Set volume
                backgroundMusic.volume = 0.3;
                
                // Start playing background music automatically
                backgroundMusic.play().then(() => {
                    updateMusicButton();
                }).catch(error => {
                    console.log('Auto-play prevented by browser. User interaction required.');
                    // If autoplay is blocked, show a different state
                    musicPlaying = false;
                    updateMusicButton();
                });
            } catch (error) {
                console.error('Error initializing audio:', error);
            }
        }

function updateMusicButton() {
  const musicText = document.getElementById('musicText');
  const toggleCircle = document.getElementById('toggleCircle');
  const musicToggle = document.getElementById('musicToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  if (musicPlaying && !musicMuted) {

    musicToggle.style.background = '#4abe4a'; // Green
    toggleCircle.style.left = '2px';
    toggleIcon.textContent = '🎵';
  } else {

    musicToggle.style.background = '#ff4a4a'; // Red
    toggleCircle.style.left = '42px';
    toggleIcon.textContent = '🔇';
  }
}
function toggleMusic() {
    playClickSound();

    if (!backgroundMusic) {
        initializeAudio();
        return;
    }

    if (musicPlaying) {
        backgroundMusic.pause();
        musicPlaying = false;
        musicMuted = true;
        updateMusicButton(); // update immediately
    } else {
        backgroundMusic.play().then(() => {
            musicPlaying = true;
            musicMuted = false;
            updateMusicButton(); // update once music starts
        }).catch(error => {
            console.error('Error playing music:', error);
        });
    }
}
        function playClickSound() {
            if (!audioContext) {
                try {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                } catch (error) {
                    return;
                }
            }
            
            try {
                // Create a more sophisticated click sound
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                const filterNode = audioContext.createBiquadFilter();
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                // Create a "pop" sound effect
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.05);
                
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(2000, audioContext.currentTime);
                filterNode.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.05);
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
            } catch (error) {
                console.error('Error playing click sound:', error);
            }
        }

        function openWindow(windowType) {
            playClickSound();
            const window = document.getElementById(windowType + '-window');
            window.style.display = 'block';
            
            // Bring window to front
            bringWindowToFront(window);
            
            // Position window randomly but ensure it's visible
            const x = Math.random() * (window.innerWidth - 500);
            const y = Math.random() * (window.innerHeight - 400) + 100;
            
            window.style.left = Math.max(50, x) + 'px';
            window.style.top = Math.max(120, y) + 'px';
        }

        function closeWindow(windowId) {
            playClickSound();
            document.getElementById(windowId).style.display = 'none';
        }

        function bringWindowToFront(windowElement) {
            highestZIndex += 1;
            windowElement.style.zIndex = highestZIndex;
            
            // Remove active class from all windows
            document.querySelectorAll('.window').forEach(w => w.classList.remove('active'));
            
            // Add active class to current window
            windowElement.classList.add('active');
        }

        function submitForm(event) {
            event.preventDefault();
            playClickSound();
            
            const formData = new FormData(event.target);
            const data = {
                name: formData.get('name'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            // Create success notification
            showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
            event.target.reset();
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 600;
                max-width: 300px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 4 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 4000);
        }

        // Drag functionality for windows
        function startDrag(e) {
            const windowElement = e.target.closest('.window');
            if (!windowElement || !e.target.closest('.window-header')) return;
            
            // Bring window to front when starting to drag
            bringWindowToFront(windowElement);
            
            draggedWindow = windowElement;
            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            document.addEventListener('mousemove', dragWindow);
            document.addEventListener('mouseup', stopDrag);
            
            windowElement.style.cursor = 'grabbing';
            e.preventDefault();
        }

        function dragWindow(e) {
            if (!draggedWindow) return;
            
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // Keep window within viewport bounds
            const maxX = window.innerWidth - draggedWindow.offsetWidth;
            const maxY = window.innerHeight - draggedWindow.offsetHeight;
            
            draggedWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            draggedWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        }

        function stopDrag() {
            if (draggedWindow) {
                draggedWindow.style.cursor = 'default';
                draggedWindow = null;
            }
            document.removeEventListener('mousemove', dragWindow);
            document.removeEventListener('mouseup', stopDrag);
        }

        // Click to bring window to front
        function windowClick(e) {
            const windowElement = e.target.closest('.window');
            if (windowElement && windowElement.style.display !== 'none') {
                bringWindowToFront(windowElement);
            }
        }

        // Add event listeners
        document.addEventListener('mousedown', startDrag);
        document.addEventListener('click', windowClick);

        // Add floating particles for visual enhancement
        function createFloatingParticles() {
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    pointer-events: none;
                    animation: float ${10 + Math.random() * 10}s infinite linear;
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 10}s;
                    z-index: 0;
                `;
                document.body.appendChild(particle);
            }
        }

        // Add CSS animation for particles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        // Create floating particles
        createFloatingParticles();

        // Handle visibility change (for music continuation after tab switch)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                // Tab is hidden
                if (backgroundMusic && musicPlaying && !musicMuted) {
                    backgroundMusic.volume = 0.1; // Lower volume when tab is hidden
                }
            } else {
                // Tab is visible
                if (backgroundMusic && musicPlaying && !musicMuted) {
                    backgroundMusic.volume = 0.3; // Restore volume when tab is visible
                }
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            // Press M to toggle music
            if (e.key.toLowerCase() === 'm' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                toggleMusic();
            }
            
            // Press Escape to close all windows
            if (e.key === 'Escape') {
                document.querySelectorAll('.window').forEach(window => {
                    window.style.display = 'none';
                });
                playClickSound();
            }
            
            // Press numbers 1-5 to open specific windows
            const windowMap = {
                '1': 'experience',
                '2': 'projects', 
                '3': 'skills',
                '4': 'about',
                '5': 'contact'
            };
            
            if (windowMap[e.key] && !e.target.matches('input, textarea')) {
                e.preventDefault();
                openWindow(windowMap[e.key]);
            }
        });

        // Add ripple effect to buttons
        function createRipple(e) {
            const button = e.target.closest('.nav-button, .social-link, .project-link');
            if (!button) return;
            
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;
            
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        }

        // Add ripple animation CSS
        const rippleStyle = document.createElement('style');
        rippleStyle.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(rippleStyle);

        // Add ripple effect to clickable elements
        document.addEventListener('click', createRipple);

        // Smooth scroll for better UX (if content overflows)
        const addSmoothScroll = () => {
            const containers = document.querySelectorAll('.window-content, .projects-container');
            containers.forEach(container => {
                container.style.scrollBehavior = 'smooth';
            });
        };

        addSmoothScroll();

        // Add typing effect for notifications
        function typeWriter(element, text, speed = 50) {
            element.textContent = '';
            let i = 0;
            const timer = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(timer);
                }
            }, speed);
        }

        // Enhanced form validation with better UX
        function validateForm(form) {
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                const value = input.value.trim();
                const errorElement = input.parentNode.querySelector('.error-message');
                
                // Remove existing error message
                if (errorElement) {
                    errorElement.remove();
                }
                
                if (!value) {
                    isValid = false;
                    input.style.borderColor = '#ff4757';
                    
                    const error = document.createElement('span');
                    error.className = 'error-message';
                    error.style.cssText = 'color: #ff4757; font-size: 0.8rem; margin-top: 5px; display: block;';
                    error.textContent = `${input.labels[0].textContent.replace(':', '')} is required`;
                    input.parentNode.appendChild(error);
                } else {
                    input.style.borderColor = '#4CAF50';
                }
            });
            
            return isValid;
        }

        // Update submit form function with validation
        window.submitForm = function(event) {
            event.preventDefault();
            playClickSound();
            
            if (!validateForm(event.target)) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            const formData = new FormData(event.target);
            const data = {
                name: formData.get('name'),
                subject: formData.get('subject'),
                message: formData.get('message')
            };
            
            // Show loading state
            const submitButton = event.target.querySelector('.submit-button');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate sending (replace with actual API call)
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
                event.target.reset();
                
                // Reset input border colors
                event.target.querySelectorAll('input, textarea').forEach(input => {
                    input.style.borderColor = '#e0e0e0';
                });
            }, 2000);
        };

        // Update notification function to handle error type
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const colors = {
                success: '#4CAF50',
                error: '#ff4757',
                info: '#2196F3'
            };
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${colors[type]};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 600;
                max-width: 300px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
                border-left: 4px solid rgba(255,255,255,0.3);
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            // Remove after 4 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }

        // Add some interactive effects for better engagement
        function addInteractiveEffects() {
            // Hover effect for profile picture
            const profilePic = document.querySelector('.profile-picture');
            if (profilePic) {
                profilePic.addEventListener('mouseenter', function() {
                    this.style.transform = 'scale(1.05) rotate(2deg)';
                    this.style.transition = 'all 0.3s ease';
                });
                
                profilePic.addEventListener('mouseleave', function() {
                    this.style.transform = 'scale(1) rotate(0deg)';
                });
            }
            
            // Add pulse effect to music visualizer when music is playing
            const musicVisualizer = document.getElementById('musicVisualizer');
            if (musicVisualizer) {
                setInterval(() => {
                    if (musicPlaying && !musicMuted) {
                        const bars = musicVisualizer.querySelectorAll('.music-bar');
                        bars.forEach(bar => {
                            const randomHeight = Math.random() * 14 + 4;
                            bar.style.height = randomHeight + 'px';
                        });
                    }
                }, 200);
            }
        }

        // Initialize interactive effects after page load
        setTimeout(addInteractiveEffects, 2500);

        console.log('🎵 Portfolio loaded successfully!');
        console.log('💡 Pro tips:');
        console.log('   • Press "M" to toggle music');
        console.log('   • Press "Esc" to close all windows');
        console.log('   • Press 1-5 to open specific sections');
        console.log('   • Drag windows around to organize them');
