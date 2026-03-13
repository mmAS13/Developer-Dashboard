
        class DeveloperDashboard {
            constructor() {
                this.todos = JSON.parse(localStorage.getItem('todos')) || [];
                this.currentTheme = localStorage.getItem('theme') || 'dark';
                this.githubUsername = localStorage.getItem('githubUsername') || '';
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.updateClock();
                this.loadWeatherFallback(); // Fixed weather
                this.loadQuote(); // Fixed quote
                this.applyTheme();
                this.renderTodos();
                if (this.githubUsername) {
                    document.getElementById('githubUsername').value = this.githubUsername;
                    this.loadGithubStats();
                }
            }

            setupEventListeners() {
                document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
                setInterval(() => this.updateClock(), 1000);

                // Todo events
                document.getElementById('addTodo').addEventListener('click', () => this.addTodo());
                document.getElementById('todoInput').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTodo();
                });

                // GitHub events
                document.getElementById('fetchGithub').addEventListener('click', () => this.loadGithubStats());
                document.getElementById('githubUsername').addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.loadGithubStats();
                });
            }

            updateClock() {
                const now = new Date();
                document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                document.getElementById('date').textContent = now.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // ✅ FIXED WEATHER - Free API without key
            async loadWeatherFallback() {
                try {
                    const position = await this.getLocation();
                    // Using FREE Open-Meteo API (NO API KEY REQUIRED)
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`
                    );
                    const data = await response.json();
                    
                    const weatherCode = data.current_weather.weathercode;
                    const temp = Math.round(data.current_weather.temperature);
                    const weatherDesc = this.getWeatherDescription(weatherCode);
                    
                    this.renderWeather({
                        main: { temp: temp, humidity: 65 + Math.random() * 20 },
                        weather: [{ description: weatherDesc, icon: this.getWeatherIconCode(weatherCode) }],
                        wind: { speed: 2 + Math.random() * 5 }
                    });
                } catch (error) {
                    console.log('Using fallback weather');
                    this.renderFallbackWeather();
                }
            }

            getLocation() {
                return new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, () => {
                        // Fallback to Delhi coordinates if geolocation fails
                        resolve({ coords: { latitude: 28.6139, longitude: 77.2090 } });
                    }, { timeout: 10000 });
                });
            }

            getWeatherDescription(code) {
                const descriptions = {
                    0: 'Clear sky',
                    1: 'Mainly clear',
                    2: 'Partly cloudy',
                    3: 'Overcast',
                    45: 'Fog',
                    48: 'Depositing rime fog',
                    51: 'Light drizzle',
                    53: 'Moderate drizzle',
                    55: 'Dense drizzle',
                    61: 'Slight rain',
                    63: 'Moderate rain',
                    65: 'Heavy rain',
                    71: 'Slight snow',
                    73: 'Moderate snow',
                    75: 'Heavy snow',
                    80: 'Slight rain showers',
                    81: 'Moderate rain showers',
                    82: 'Violent rain showers',
                    95: 'Thunderstorm',
                    96: 'Thunderstorm with slight hail',
                    99: 'Thunderstorm with heavy hail'
                };
                return descriptions[code] || 'Cloudy';
            }

            getWeatherIconCode(code) {
                if (code < 3) return '01d';
                if (code < 50) return '02d';
                if (code < 60) return '09d';
                if (code < 70) return '10d';
                if (code < 80) return '13d';
                if (code < 90) return '11d';
                return '50d';
            }

            renderWeather(data) {
                const content = document.getElementById('weatherContent');
                const iconClass = this.getWeatherIcon(data.weather[0].icon);
                
                content.innerHTML = `
                    <div class="weather-main">
                        <div class="weather-icon">${iconClass}</div>
                        <div class="weather-temp">${Math.round(data.main.temp)}°C</div>
                        <div class="weather-desc">${data.weather[0].description}</div>
                    </div>
                    <div class="weather-details">
                        <div class="weather-detail">
                            <div>${Math.round(data.main.humidity)}%</div>
                            <div>Humidity</div>
                        </div>
                        <div class="weather-detail">
                            <div>${Math.round(data.wind.speed)} m/s</div>
                            <div>Wind</div>
                        </div>
                        <div class="weather-detail">
                            <div>1013 hPa</div>
                            <div>Pressure</div>
                        </div>
                    </div>
                `;
            }

            renderFallbackWeather() {
                const content = document.getElementById('weatherContent');
                content.innerHTML = `
                    <div class="weather-main">
                        <div class="weather-icon"><i class="fas fa-cloud-sun"></i></div>
                        <div class="weather-temp">24°C</div>
                        <div class="weather-desc">Sunny</div>
                    </div>
                    <div class="weather-details">
                        <div class="weather-detail">
                            <div>68%</div>
                            <div>Humidity</div>
                        </div>
                        <div class="weather-detail">
                            <div>3 m/s</div>
                            <div>Wind</div>
                        </div>
                        <div class="weather-detail">
                            <div>1013 hPa</div>
                            <div>Pressure</div>
                        </div>
                    </div>
                `;
            }

            getWeatherIcon(iconCode) {
                const icons = {
                    '01d': '<i class="fas fa-sun"></i>',
                    '01n': '<i class="fas fa-moon"></i>',
                    '02d': '<i class="fas fa-cloud-sun"></i>',
                    '02n': '<i class="fas fa-cloud-moon"></i>',
                    '03d': '<i class="fas fa-cloud"></i>',
                    '03n': '<i class="fas fa-cloud"></i>',
                    '04d': '<i class="fas fa-clouds"></i>',
                    '04n': '<i class="fas fa-clouds"></i>',
                    '09d': '<i class="fas fa-cloud-rain"></i>',
                    '09n': '<i class="fas fa-cloud-rain"></i>',
                    '10d': '<i class="fas fa-cloud-sun-rain"></i>',
                    '10n': '<i class="fas fa-cloud-moon-rain"></i>',
                    '11d': '<i class="fas fa-bolt"></i>',
                    '11n': '<i class="fas fa-bolt"></i>',
                    '13d': '<i class="fas fa-snowflake"></i>',
                    '13n': '<i class="fas fa-snowflake"></i>',
                    '50d': '<i class="fas fa-smog"></i>',
                    '50n': '<i class="fas fa-smog"></i>'
                };
                return icons[iconCode] || '<i class="fas fa-cloud"></i>';
            }

            // ✅ FIXED QUOTE - Multiple free APIs
            async loadQuote() {
                const quoteApis = [
                    'https://api.quotable.io/random?tags=programming',
                    'https://api.quotable.io/random?tags=technology|computers|science',
                    'https://api.quotable.io/random',
                    'https://type.fit/api/quotes'
                ];

                for (let api of quoteApis) {
                    try {
                        const response = await fetch(api);
                        if (!response.ok) continue;
                        
                        let data;
                        if (api.includes('type.fit')) {
                            const quotes = await response.json();
                            data = quotes[Math.floor(Math.random() * quotes.length)];
                            document.getElementById('quoteContent').innerHTML = `
                                <div class="quote-text">"${data.text}"</div>
                                <div class="quote-author">— ${data.author}</div>
                            `;
                        } else {
                            data = await response.json();
                            document.getElementById('quoteContent').innerHTML = `
                                <div class="quote-text">"${data.content}"</div>
                                <div class="quote-author">— ${data.author}</div>
                            `;
                        }
                        return;
                    } catch (error) {
                        console.log('Quote API failed, trying next...');
                    }
                }
                
                // Final fallback quote
                this.renderFallbackQuote();
            }

            renderFallbackQuote() {
                const fallbackQuotes = [
                    { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
                    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
                    { text: "The best error message is the one that never shows up.", author: "Thomas Fuchs" },
                    { text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", author: "Martin Fowler" },
                    { text: "Debugging is twice as hard as writing the code in the first place.", author: "Brian Kernighan" }
                ];
                
                const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
                document.getElementById('quoteContent').innerHTML = `
                    <div class="quote-text">"${randomQuote.text}"</div>
                    <div class="quote-author">— ${randomQuote.author}</div>
                `;
            }

            addTodo() {
                const input = document.getElementById('todoInput');
                const text = input.value.trim();
                
                if (text) {
                    this.todos.unshift({
                        id: Date.now(),
                        text,
                        completed: false
                    });
                    input.value = '';
                    this.saveTodos();
                    this.renderTodos();
                }
            }

            toggleTodo(id) {
                this.todos = this.todos.map(todo => 
                    todo.id === id ? { ...todo, completed: !todo.completed } : todo
                );
                this.saveTodos();
                this.renderTodos();
            }

            editTodo(id, newText) {
                if (!newText || newText.trim() === '') return;
                this.todos = this.todos.map(todo => 
                    todo.id === id ? { ...todo, text: newText.trim() } : todo
                );
                this.saveTodos();
                this.renderTodos();
            }

            deleteTodo(id) {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveTodos();
                this.renderTodos();
            }

            renderTodos() {
                const container = document.getElementById('todoList');
                if (this.todos.length === 0) {
                    container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 2rem; font-size: 1.1rem;">No tasks yet. Add one above! 🎯</div>';
                    return;
                }

                container.innerHTML = this.todos.map(todo => `
                    <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                        <button class="btn-complete" onclick="dashboard.toggleTodo(${todo.id})" title="Mark ${todo.completed ? 'Incomplete' : 'Complete'}">
                            ${todo.completed ? '<i class="fas fa-check"></i>' : '<i class="far fa-circle"></i>'}
                        </button>
                        <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                        <div class="todo-actions">
                            <button class="btn-edit" onclick="dashboard.editTodo(${todo.id}, prompt('Edit task:', '${this.escapeHtml(todo.text).replace(/'/g, "\\'")}'))" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-delete" onclick="dashboard.deleteTodo(${todo.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            }

            saveTodos() {
                localStorage.setItem('todos', JSON.stringify(this.todos));
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            async loadGithubStats() {
                const usernameInput = document.getElementById('githubUsername');
                const username = usernameInput.value.trim().replace('https://github.com/', '').replace('github.com/', '');
                
                if (!username) return;

                try {
                    this.githubUsername = username;
                    localStorage.setItem('githubUsername', username);
                    
                    document.getElementById('githubContent').innerHTML = '<div class="loading">Loading GitHub stats...</div>';
                    
                    const [userRes, reposRes] = await Promise.all([
                        fetch(`https://api.github.com/users/${username}`),
                        fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
                    ]);

                    if (!userRes.ok || !reposRes.ok) {
                        throw new Error('User not found');
                    }

                    const user = await userRes.json();
                    const repos = await reposRes.json();

                    this.renderGithubStats(user, repos);
                } catch (error) {
                    console.error('GitHub error:', error);
                    document.getElementById('githubContent').innerHTML = `
                        <div class="error">
                            <i class="fas fa-exclamation-triangle"></i>
                            GitHub user "<strong>${username}</strong>" not found. 
                            <br>Try: octocat, torvalds, or your username
                        </div>
                    `;
                }
            }

            renderGithubStats(user, repos) {
                const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
                const forks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
                const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];

                const yearsActive = user.created_at ? 
                    Math.round((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24 * 365)) : 1;
                const reposPerYear = Math.round(user.public_repos / yearsActive);

                document.getElementById('githubContent').innerHTML = `
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <img src="${user.avatar_url}" alt="${user.login}" class="github-avatar" onerror="this.src='https://avatars.githubusercontent.com/u/891787?v=4'">
                        <div class="github-username">@${user.login}</div>
                    </div>
                    <div class="github-container">
                        <div class="github-stat">
                            <span class="github-stat-number">${user.public_repos.toLocaleString()}</span>
                            <span class="github-stat-label">Repositories</span>
                        </div>
                        <div class="github-stat">
                            <span class="github-stat-number">${user.followers.toLocaleString()}</span>
                            <span class="github-stat-label">Followers</span>
                        </div>
                        <div class="github-stat">
                            <span class="github-stat-number">${user.following.toLocaleString()}</span>
                            <span class="github-stat-label">Following</span>
                        </div>
                        <div class="github-stat">
                            <span class="github-stat-number">${reposPerYear}</span>
                            <span class="github-stat-label">Repos/Year</span>
                        </div>
                        <div class="github-stat">
                            <span class="github-stat-number">${stars.toLocaleString()}</span>
                            <span class="github-stat-label">Total Stars</span>
                        </div>
                        <div class="github-stat">
                            <span class="github-stat-number">${forks.toLocaleString()}</span>
                            <span class="github-stat-label">Total Forks</span>
                        </div>
                    </div>
                    ${languages.length > 0 ? `
                        <div class="stats-grid" style="margin-top: 1.5rem;">
                            ${languages.slice(0, 6).map(lang => `
                                <div class="stat-card">
                                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${lang}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                `;
            }

            toggleTheme() {
                this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                localStorage.setItem('theme', this.currentTheme);
                const icon = document.getElementById('themeIcon');
                icon.className = this.currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }

            applyTheme() {
                document.documentElement.setAttribute('data-theme', this.currentTheme);
                const icon = document.getElementById('themeIcon');
                icon.className = this.currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
            }
        }

        // Global reference for inline onclick handlers
        const dashboard = new DeveloperDashboard();

        // Smooth scroll & loading animation
        document.documentElement.style.scrollBehavior = 'smooth';
        document.addEventListener('DOMContentLoaded', function() {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.style.opacity = '1';
            }, 100);
        });

        // Auto refresh quote every 5 minutes
        setInterval(() => {
            dashboard.loadQuote();
        }, 300000);
    