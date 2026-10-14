// ============================================================
// みるナビ アプリケーションロジック (app.js)
// ============================================================

const app = {
    defaultAvatar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0UzMDYxMyIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNDAiIHI9IjIwIiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0gMjAgOTAgUSA1MCA2MCA4MCA5MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI4IiBmaWxsPSJub25lIi8+PC9zdmc+',

    chars: {
        default: `<svg viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#E30613"/><stop offset="100%" stop-color="#FF4757"/></linearGradient></defs><circle cx="50" cy="55" r="35" fill="url(#g1)" stroke="#111" stroke-width="3"/><circle class="char-eye" cx="35" cy="45" r="6" fill="white"/><circle class="char-eye" cx="65" cy="45" r="6" fill="white"/><circle cx="35" cy="45" r="2" fill="#111"/><circle cx="65" cy="45" r="2" fill="#111"/><path d="M 40 65 Q 50 75 60 65" stroke="white" stroke-width="3" fill="none"/><rect x="45" y="15" width="10" height="15" fill="url(#g1)" stroke="#111" stroke-width="3"/><circle cx="50" cy="10" r="8" fill="#FFD700" stroke="#111" stroke-width="3"/></svg>`,
        cat: `<svg viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#FFA500"/></linearGradient></defs><path d="M 20 40 L 30 15 L 50 35 L 70 15 L 80 40 Q 90 70 50 85 Q 10 70 20 40" fill="url(#g2)" stroke="#111" stroke-width="3"/><circle class="char-eye" cx="35" cy="45" r="6" fill="white"/><circle class="char-eye" cx="65" cy="45" r="6" fill="white"/><circle cx="35" cy="45" r="2" fill="#111"/><circle cx="65" cy="45" r="2" fill="#111"/><path d="M 45 60 Q 50 65 55 60" stroke="#111" stroke-width="2" fill="none"/><path d="M 30 55 L 20 50 M 70 55 L 80 50" stroke="#111" stroke-width="2"/></svg>`,
        bear: `<svg viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#A0522D"/><stop offset="100%" stop-color="#8B4513"/></linearGradient></defs><circle cx="25" cy="25" r="15" fill="url(#g3)" stroke="#111" stroke-width="3"/><circle cx="75" cy="25" r="15" fill="url(#g3)" stroke="#111" stroke-width="3"/><circle cx="50" cy="55" r="35" fill="url(#g3)" stroke="#111" stroke-width="3"/><circle class="char-eye" cx="35" cy="45" r="5" fill="#111"/><circle class="char-eye" cx="65" cy="45" r="5" fill="#111"/><ellipse cx="50" cy="60" rx="12" ry="8" fill="#F4A460" stroke="#111" stroke-width="3"/><circle cx="50" cy="58" r="4" fill="#111"/></svg>`,
        dog: `<svg viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D2691E"/><stop offset="100%" stop-color="#A0522D"/></linearGradient></defs><path d="M 20 30 Q 10 50 20 70 L 30 60 Q 50 80 70 60 L 80 70 Q 90 50 80 30 Q 50 10 20 30" fill="url(#g4)" stroke="#111" stroke-width="3"/><circle class="char-eye" cx="35" cy="40" r="5" fill="white"/><circle class="char-eye" cx="65" cy="40" r="5" fill="white"/><circle cx="35" cy="40" r="2" fill="#111"/><circle cx="65" cy="40" r="2" fill="#111"/><ellipse cx="50" cy="55" rx="10" ry="8" fill="#111"/><path d="M 45 65 Q 50 70 55 65" stroke="white" stroke-width="2" fill="none"/></svg>`,
        rabbit: `<svg viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#E0E0E0"/></linearGradient></defs><ellipse cx="30" cy="25" rx="10" ry="25" fill="url(#g5)" stroke="#111" stroke-width="3"/><ellipse cx="70" cy="25" rx="10" ry="25" fill="url(#g5)" stroke="#111" stroke-width="3"/><circle cx="50" cy="55" r="35" fill="url(#g5)" stroke="#111" stroke-width="3"/><circle class="char-eye" cx="35" cy="45" r="5" fill="#E30613"/><circle class="char-eye" cx="65" cy="45" r="5" fill="#E30613"/><circle cx="50" cy="55" r="4" fill="#E30613"/><path d="M 45 65 Q 50 70 55 65" stroke="#E30613" stroke-width="2" fill="none"/></svg>`
    },

    state: {
        currentUser: null,
        recipes: [],
        displayedCount: 0,
        currentFilter: 'all',
        currentView: 'home',
        stream: null
    },

    ingredientAliases: {
        "じゃがいも": ["じゃがいも", "馬鈴薯", "ポテト", "いも"],
        "たまねぎ": ["たまねぎ", "玉ねぎ", "タマネギ", "オニオン"],
        "にんじん": ["にんじん", "人参", "キャロット"],
        "ねぎ": ["ねぎ", "長ねぎ", "青ねぎ", "ネギ"],
        "しめじ": ["しめじ", "シメジ"],
        "えのき": ["えのき", "エノキ", "えのきだけ"],
        "まいたけ": ["まいたけ", "マイタケ"],
        "ピーマン": ["ピーマン", "ぴーまん", "まんさい"],
        "トマト": ["トマト", "とまと"],
        "キャベツ": ["キャベツ", "きゃべつ"],
        "レタス": ["レタス", "れたす"],
        "豚肉": ["豚肉", "豚", "ぶたにく", "ポーク"],
        "牛肉": ["牛肉", "牛", "ぎゅうにく", "ビーフ"],
        "鶏肉": ["鶏肉", "鶏", "とりにく", "チキン"],
        "ひき肉": ["ひき肉", "合挽き肉", "合いびき肉", "ミンチ"],
        "卵": ["卵", "たまご", "玉子", "エッグ"],
        "豆腐": ["豆腐", "とうふ", "木綿豆腐", "絹ごし豆腐"],
        "米": ["米", "ごはん", "ご飯", "ライス"],
        "きゅうり": ["きゅうり", "キュウリ"],
        "なす": ["なす", "ナス", "茄子"],
        "とうもろこし": ["とうもろこし", "トウモロコシ", "コーン"],
        "オクラ": ["オクラ", "おくら"],
        "アジ": ["アジ", "あじ", "鯵"]
    },

    recipeDB: [
        { name: "本格豚こま肉じゃが", category:0,main: "豚肉", time: 40, diff: 2, desc: "甘辛い味がご飯に止まらない、定番の家庭料理。", ingredients: ["豚こま切れ肉 200g", "じゃがいも 3個", "玉ねぎ 1個", "醤油 大さじ3", "砂糖 大さじ2", "みりん 大さじ2"], steps: ["じゃがいもは乱切り、玉ねぎはくし切りにする。", "鍋に油を熱し、豚肉と玉ねぎを炒める。", "じゃがいもを加えてさらに炒める。", "調味料を加え、落し蓋をして中火で15分煮る。"] },
        // { name: "とろとろ卵のオムライス", main: "卵", time: 25, diff: 3, desc: "ケチャップライスをふわとろ卵で包んだ一品。", ingredients: ["卵 3個", "ご飯 茶碗1杯", "鶏もも肉 50g", "玉ねぎ 1/4個", "ケチャップ 大さじ3"], steps: ["鶏肉と玉ねぎはみじん切りにする。", "フライパンで炒め、ご飯とケチャップを加える。", "別のフライパンで卵を半熟にし、包み込む。"] },
        // { name: "初夏の冷やし中華", main: "きゅうり", time: 20, diff: 2, desc: "夏に食べたい、さっぱりとした酸味が決め手。", ingredients: ["中華麺 2玉", "ハム 4枚", "きゅうり 1本", "卵 2個", "醤油 大さじ2", "酢 大さじ3", "砂糖 大さじ2", "ごま油 大さじ1"], steps: ["中華麺を茹でて冷水で締める。", "ハムときゅうりは細切りにする。", "卵は薄焼き卵にして細切りにする。", "調味料を混ぜ合わせてタレを作り、かける。"] },
        // { name: "なすと豚ひき肉の味噌炒め", main: "なす", time: 20, diff: 2, desc: "とろとろのナスとピリ辛の味噌が絶妙に合う。", ingredients: ["なす 3本", "豚ひき肉 150g", "にんにく・生姜 各1片", "味噌 大さじ2", "甜麺醤 大さじ1", "醤油 大さじ1", "砂糖 小さじ1"], steps: ["ナスは乱切りにして水にさらす。", "フライパンでナスを油で炒める。", "ひき肉とにんにく・生姜を炒め、調味料を加える。", "ナスを加えて煮込み、とろみをつける。"] },
        // { name: "とうもろこしの天ぷら", main: "とうもろこし", time: 30, diff: 3, desc: "甘みが凝縮された、夏の天ぷら。", ingredients: ["とうもろこし 1本", "薄力粉 100g", "冷水 150ml", "卵黄 1個", "天つゆ 適量"], steps: ["とうもろこしは茹でて粒をそぎ落とす。", "薄力粉、冷水、卵黄をさっくり混ぜて衣を作る。", "とうもろこしに衣をつけて170度の油で揚げる。"] },
        // { name: "オクラと豆腐のさっぱり和え", main: "オクラ", time: 10, diff: 1, desc: "火を使わない、超時短ヘルシー副菜。", ingredients: ["オクラ 5本", "木綿豆腐 1/2丁", "醤油 大さじ2", "ごま油 小さじ1", "かつお節 適量"], steps: ["オクラは板ずりして茹で、小口切りにする。", "豆腐は水切りをして器に盛る。", "オクラをのせ、醤油、ごま油、かつお節をかける。"] },
        // { name: "アジの南蛮漬け", main: "アジ", time: 30, diff: 2, desc: "揚げた魚を甘酢に浸した、さっぱり料理。", ingredients: ["アジ 2尾", "玉ねぎ 1/2個", "パプリカ 1/2個", "酢 大さじ3", "醤油 大さじ2", "砂糖 大さじ2", "水 大さじ2"], steps: ["アジは3枚におろし、食べやすい大きさに切る。", "玉ねぎとパプリカは薄切りにし、調味料に浸す。", "アジに片栗粉をまぶし、170度の油で揚げる。", "揚げたアジを調味料に浸し、冷蔵庫で冷やす。"] },
        // { name: "ピリ辛麻婆豆腐", main: "豆腐", time: 20, diff: 2, desc: "辛さと旨みが際立つ、中華の王道。", ingredients: ["木綿豆腐 1丁", "豚ひき肉 150g", "長ねぎ 1/2本", "豆瓣醤 大さじ1", "甜麺醤 大さじ1", "醤油 大さじ1", "水 150ml", "片栗粉 大さじ1"], steps: ["豆腐は2cm角に切り、塩湯でさっと茹でる。", "ひき肉を炒め、調味料を加える。", "豆腐を加えて優しく煮込む。", "水溶き片栗粉でとろみをつける。"] },
        // { name: "チャーハン", main: "米", time: 15, diff: 2, desc: "パラパラに仕上げるのがコツの鉄板料理。", ingredients: ["ご飯 茶碗2杯", "卵 2個", "長ねぎ 1/2本", "ハム 2枚", "醤油 大さじ1", "塩コショウ 少々", "ごま油 大さじ1"], steps: ["卵は溶きほぐし、ねぎとハムはみじん切りにする。", "ごま油で卵を半熟にして取り出す。", "ねぎとハムを炒め、ご飯を加えてほぐす。", "卵を戻し、調味料で強火で炒め合わせる。"] },
        // { name: "ポテトサラダ", main: "じゃがいも", time: 20, diff: 1, desc: "作り置きにも最適な、ほっこり副菜。", ingredients: ["じゃがいも 3個", "きゅうり 1本", "ハム 4枚", "玉ねぎ 1/4個", "マヨネーズ 大さじ4", "塩コショウ 少々"], steps: ["じゃがいもは皮をむき、柔らかくなるまで茹でてマッシュする。", "きゅうりは薄切り、ハムと玉ねぎはみじん切りにする。", "きゅうりに塩を振って水気を絞る。", "すべての材料を混ぜ合わせる。"] }
    ],

    storeItems: [
        { id: 'char_cat', name: 'みるキャット', type: 'char', price: 500, icon: 'cat' },
        { id: 'char_bear', name: 'みるベア', type: 'char', price: 800, icon: 'bear' },
        { id: 'char_dog', name: 'みるドッグ', type: 'char', price: 600, icon: 'dog' },
        { id: 'char_rabbit', name: 'みるラビット', type: 'char', price: 700, icon: 'rabbit' },
        { id: 'acc_hat', name: 'シェフ帽子', type: 'acc', price: 200, icon: '👨‍🍳' },
        { id: 'acc_glasses', name: 'サングラス', type: 'acc', price: 150, icon: '🕶️' },
        { id: 'acc_bow', name: 'リボン', type: 'acc', price: 150, icon: '🎀' },
        { id: 'acc_crown', name: '王冠', type: 'acc', price: 1000, icon: '👑' }
    ],

    //ここから変更 6/19
    defaultSettings: {
    fontSize: '16px',
    notifications: true,
    theme: 'light',
    reduceMotion: false,
    compactRecipeCards: false,
    cameraFacingMode: 'environment',
    showAiTiming: false,
    aiResultDetail: 'normal'
    },

    init() {
        this.loadUser();
        this.ensureUserSettings();
        this.ensureUserFavorites();
        this.applySystemSettings();
        this.generateRecipes(0, 30);
        this.render();
        this.setupInfiniteScroll();
    },

    loadUser() {
        const saved = localStorage.getItem('miruNaviCurrentUser');
        if (saved) {
            this.state.currentUser = JSON.parse(saved);
            this.ensureUserSettings();
            this.ensureUserFavorites();
        }
    },

    saveUser() {
        if (this.state.currentUser) {
            this.ensureUserSettings();
            this.ensureUserFavorites();
            localStorage.setItem('miruNaviCurrentUser', JSON.stringify(this.state.currentUser));
            const users = JSON.parse(localStorage.getItem('miruNaviUsers') || '[]');
            const idx = users.findIndex(u => u.email === this.state.currentUser.email);
            if (idx !== -1) {
                users[idx] = this.state.currentUser;
                localStorage.setItem('miruNaviUsers', JSON.stringify(users));
            }
        } else {
            localStorage.removeItem('miruNaviCurrentUser');
        }
        this.updateCharacterUI();
        this.renderHeader();
    },

    ensureUserSettings() {
        if (!this.state.currentUser) return null;
        this.state.currentUser.settings = {
            ...this.defaultSettings,
            ...(this.state.currentUser.settings || {})
        };
        return this.state.currentUser.settings;
    },

    ensureUserFavorites() {
        if (!this.state.currentUser) return [];
        if (!Array.isArray(this.state.currentUser.favorites)) {
            this.state.currentUser.favorites = [];
        }
        return this.state.currentUser.favorites;
    },

    getRecipeTitle(recipe) {
        return recipe?.title || recipe?.name || '名称未設定のレシピ';
    },

    getFavoriteKey(recipe) {
        const title = this.getRecipeTitle(recipe).trim();
        const main = (recipe?.main || '').trim();
        return `${title}__${main}`.toLowerCase();
    },

    normalizeRecipeSnapshot(recipe) {
        return {
            title: this.getRecipeTitle(recipe),
            main: recipe?.main || '',
            time: recipe?.time || 0,
            diff: recipe?.diff || 1,
            desc: recipe?.desc || '',
            ingredients: Array.isArray(recipe?.ingredients) ? [...recipe.ingredients] : [],
            steps: Array.isArray(recipe?.steps) ? [...recipe.steps] : []
        };
    },

    createFavoriteSnapshot(recipe) {
        const snapshot = this.normalizeRecipeSnapshot(recipe);
        return {
            ...snapshot,
            favoriteKey: this.getFavoriteKey(snapshot),
            savedAt: new Date().toISOString()
        };
    },

    isFavorite(recipe) {
        const favorites = this.ensureUserFavorites();
        const key = this.getFavoriteKey(recipe);
        return favorites.some(fav => (fav.favoriteKey || this.getFavoriteKey(fav)) === key);
    },

    toggleFavorite(recipe, event) {
        if (event) event.stopPropagation();
        if (!this.state.currentUser) {
            alert('お気に入りを使うにはログインが必要です。');
            this.openAuthModal();
            return;
        }

        const favorites = this.ensureUserFavorites();
        const key = this.getFavoriteKey(recipe);
        const index = favorites.findIndex(fav => (fav.favoriteKey || this.getFavoriteKey(fav)) === key);

        if (index >= 0) {
            favorites.splice(index, 1);
        } else {
            favorites.unshift(this.createFavoriteSnapshot(recipe));
        }

        this.saveUser();

        if (this.state.currentView === 'favorites') {
            this.renderFavorites(document.getElementById('main-content'));
        } else if (this.currentRecipe && this.getFavoriteKey(this.currentRecipe) === key) {
            this.openRecipe(this.currentRecipe);
        } else {
            this.renderRecipeList();
        }
    },

    renderFavoriteButton(recipe) {
        const active = this.isFavorite(recipe);
        return `
            <button class="btn ${active ? 'btn-primary' : 'btn-outline'}" onclick="app.toggleFavorite(app.currentRecipe, event)">
                ${active ? '★ お気に入り解除' : '☆ お気に入り追加'}
            </button>
        `;
    },

    applySystemSettings() {
        const settings = this.ensureUserSettings() || this.defaultSettings;
        document.documentElement.style.setProperty('--font-size-base', settings.fontSize || this.defaultSettings.fontSize);
        document.body.classList.toggle('theme-dark', settings.theme === 'dark');
        document.body.classList.toggle('compact-recipes', !!settings.compactRecipeCards);
        document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
    },

    updateSetting(key, value) {
        if (!this.state.currentUser) return;
        this.ensureUserSettings();
        this.state.currentUser.settings[key] = value;
        this.applySystemSettings();
        this.saveUser();
    },

    resetSystemSettings() {
        if (!this.state.currentUser) return;
        if (!confirm('システム設定だけを初期状態に戻します。アカウントや食材、DPは消えません。')) return;
        this.state.currentUser.settings = { ...this.defaultSettings };
        this.applySystemSettings();
        this.saveUser();
        this.renderSettings(document.getElementById('main-content'));
        alert('システム設定を初期化しました。');
    },
    //ここまで


    normalizeIngredient(text) {
        if (!text) return "";
        let normalized = text
            .toLowerCase()
            .replace(/[Ａ-Ｚａ-ｚ０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
            .replace(/[\u30a1-\u30f6]/g, s => String.fromCharCode(s.charCodeAt(0) - 0x0060))
            .replace(/\s+/g, "")
            .replace(/肉/g, "");

        for (const [standard, aliases] of Object.entries(this.ingredientAliases)) {
            if (aliases.some(alias => normalized.includes(alias))) {
                return standard;
            }
        }
        return normalized;
    },

    openAuthModal() { document.getElementById('auth-modal').classList.add('active'); },
    closeAuthModal() { document.getElementById('auth-modal').classList.remove('active'); },

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(el => el.classList.remove('active'));
        if (tab === 'login') {
            document.querySelectorAll('.auth-tab')[0].classList.add('active');
            document.getElementById('login-form').classList.add('active');
        } else {
            document.querySelectorAll('.auth-tab')[1].classList.add('active');
            document.getElementById('register-form').classList.add('active');
        }
    },

    handleRegister() {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-pass').value.trim();
        if (!name || !email || !pass) return alert('すべての項目を入力してください。');

        const users = JSON.parse(localStorage.getItem('miruNaviUsers') || '[]');
        if (users.find(u => u.email === email)) return alert('このメールアドレスは既に登録されています。');
        //変更点あり ゆーざーのデフォルト設定情報からフォントサイズや通知？の設定を反映
        const newUser = {
            name, email, password: pass, avatar: null,
            ingredientsList: [{name: "", amount: ""}],
            level: 1, exp: 0, maxExp: 100, dp: 0, streak: 0, lastCookDate: null,
            favorites: [],
            settings: { ...this.defaultSettings },
            inventory: [], equipped: { character: 'default', accessory: null }
        };
        //ここまで
        users.push(newUser);
        localStorage.setItem('miruNaviUsers', JSON.stringify(users));
        this.state.currentUser = newUser;
        this.saveUser();
        this.closeAuthModal();
        this.navigate('home');
        alert('アカウントを作成しました！');
    },
    //変更点あり 6/19
    handleLogin() {
        const id = document.getElementById('login-id').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        const users = JSON.parse(localStorage.getItem('miruNaviUsers') || '[]');
        const user = users.find(u => (u.email === id || u.name === id) && u.password === pass);
        if (user) {
            this.state.currentUser = user;
            this.ensureUserSettings(); //ここ
            this.ensureUserFavorites();  //ここ
            this.applySystemSettings(); //ここ
            this.saveUser();
            this.closeAuthModal();
            this.navigate('home');
        } else {
            alert('メールアドレス/ユーザーネームまたはパスワードが正しくありません。');
        }
    },


    logout() {
        this.state.currentUser = null;
        this.saveUser();
        this.navigate('home');
    },

    navigate(view) {
        const restricted = ['favorites', 'store', 'account', 'settings'];
        if (restricted.includes(view) && !this.state.currentUser) {
            alert('この機能を使用するにはログインが必要です。');
            this.openAuthModal();
            return;
        }
        this.state.currentView = view;
        if (view === 'home' || view === 'search' || view === 'community') {
            if (this.state.recipes.length === 0) this.generateRecipes(0, 30);
        }
        this.render();
    },

    async generateRecipes(offset, count) {
        const newRecipes = [];
        const adjectives = ['時短', '絶品', '簡単', '本格', 'ヘルシー', '節約', '豪華', 'とろとろ', 'パリパリ', '旨辛', '濃厚', 'さっぱり', '家庭の味', 'プロの味', '殿堂入り', '伝説の', '幻の'];
        //追加 DBからjson形式のレシピデータを取得
        try{
        const recipe_list= await loadRecipe_json()
        if (!recipe_list || recipe_list.length === 0) {
                console.error("レシピ取得失敗:レシピデータなし",error);
                return;
            }
    
        for (let i = 0; i < count; i++) {
            // const base_base = this.recipeDB[Math.floor(Math.random() * this.recipeDB.length)];
            const base = recipe_list[Math.floor(Math.random() * (recipe_list.length))]
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const id = offset + i;
            newRecipes.push({
                id:  base.recipe_id,
                title: `${adj}！${base.name}`,
                main: base.main,
                category: base.category === 0 ? "料理" : "時短料理",
                time: Math.max(5, base.time + Math.floor(Math.random() * 10) - 5),
                diff: base.diff,
                desc: base.description,
                ingredients: JSON.parse(base.ingredients),
                steps: JSON.parse(base.steps)
            });
            console.log(`${adj}!${base.title}`,`${adj}!${base.name}`)
        }
        this.state.recipes = [...this.state.recipes, ...newRecipes];
        this.state.displayedCount += count;
        
        }
        catch(error){
            
            
                console.error("error:",error);
                alert(error);
        }
    },
    setupInfiniteScroll() {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && ['home', 'search', 'community'].includes(this.state.currentView)) {
                this.generateRecipes(this.state.displayedCount, 20);
                this.renderRecipeList();
            }
        }, { threshold: 0.1 });
        const sentinel = document.createElement('div');
        sentinel.id = 'scroll-sentinel';
        sentinel.style.height = '20px';
        document.getElementById('main-content').appendChild(sentinel);
        observer.observe(sentinel);
    },

    render() {
        this.renderHeader();
        const main = document.getElementById('main-content');
        main.innerHTML = '';
        switch(this.state.currentView) {
            case 'home': this.renderHome(main); break;
            case 'search': this.renderSearch(main); break;
            case 'community': this.renderCommunity(main); break;
            case 'favorites': this.renderFavorites(main); break;
            case 'store': this.renderStore(main); break;
            case 'account': this.renderAccount(main); break;
            case 'settings': this.renderSettings(main); break;
            case 'menu-proposal': this.renderMenuProposal(main); break; //08/27 追加 開発：恒川 実装：横田
            case 'recipe-detail': this.renderRecipeDetail(main); break;
        }
    },

    renderHeader() {
        const area = document.getElementById('user-area');
        const charWidget = document.getElementById('character-widget');
        const avatarSrc = this.state.currentUser?.avatar || this.defaultAvatar;
        area.innerHTML = `<img src="${avatarSrc}" class="user-icon" onclick="${this.state.currentUser ? "app.navigate('account')" : "app.openAuthModal()"}" title="${this.state.currentUser ? 'アカウント情報' : 'ログイン'}">`;
        charWidget.style.display = this.state.currentUser ? 'block' : 'none';
    },

    renderHome(container) {
        const u = this.state.currentUser;
        const charKey = u?.equipped?.character === 'char_cat' ? 'cat'
            : u?.equipped?.character === 'char_bear' ? 'bear'
            : u?.equipped?.character === 'char_dog' ? 'dog'
            : u?.equipped?.character === 'char_rabbit' ? 'rabbit' : 'default';

        const currentMonth = new Date().getMonth() + 1;
        let seasonalName = "春";
        let seasonalIngredients = ["たけのこ", "いちご", "キャベツ"];
        if (currentMonth >= 6 && currentMonth <= 8) {
            seasonalName = "初夏・夏";
            seasonalIngredients = ["きゅうり", "なす", "とうもろこし", "オクラ", "アジ", "トマト"];
        } else if (currentMonth >= 9 && currentMonth <= 11) {
            seasonalName = "秋";
            seasonalIngredients = ["さつまいも", "かぼちゃ", "さんま", "きのこ"];
        } else if (currentMonth >= 12 || currentMonth <= 2) {
            seasonalName = "冬";
            seasonalIngredients = ["大根", "白菜", "ぶり", "みかん"];
        }

        const seasonalRecipes = this.recipeDB.filter(r =>
            seasonalIngredients.some(si => r.ingredients.some(ing => ing.includes(si)))
        ).slice(0, 5);

        let seasonalHtml = '';
        if (seasonalRecipes.length > 0) {
            seasonalHtml = `
                <div class="seasonal-section">
                    <div class="seasonal-title">🌿 今が旬！${seasonalName}の食材を使ったレシピ</div>
                    <div class="seasonal-carousel">
                        ${seasonalRecipes.map(r => `
                            <div class="seasonal-card" onclick="app.openRecipe(app.recipeDB.find(x => x.name === '${r.name}'))">
                                <span class="tag season">旬</span>
                                <h4>${r.name}</h4>
                                <p>${r.desc}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="hero-section">
                <div class="hero-text">
                    <h2>世界の料理を<br>あなたの食卓へ。</h2>
                    <p>AIがあなたの冷蔵庫と気分に合わせて、<br>数万種類のレシピから最適な料理を提案します。</p>
                    <button class="btn btn-primary" onclick="app.navigate('search')" style="font-size: 1.1rem; padding: 14px 32px;">🔍 レシピを検索する</button>
                </div>
                <div class="hero-character">
                    <div class="big-avatar">${this.chars[charKey]}</div>
                    <p style="margin-top: 16px; font-weight: 900; color: var(--text); font-size: 1rem; background: var(--accent); padding: 8px 16px; border: 3px solid var(--text); box-shadow: 4px 4px 0px var(--text);">
                        ${u ? u.name + 'のパートナー' : 'みるボット'}
                    </p>
                </div>
            </div>
            ${seasonalHtml}
            <h3 style="font-size:1.5rem; font-weight:900; margin-bottom:24px; display:inline-block; background:var(--surface); padding:8px 16px; border:3px solid var(--text); box-shadow:4px 4px 0px var(--text);">カテゴリーから探す</h3>
            <div class="search-categories">
                <button class="cat-btn" onclick="app.filterRecipes('time')">時短で作れる<small>30分以内で完成する時短レシピ</small></button>
                <button class="cat-btn" onclick="app.filterRecipes('inventory')">所持食材で作れる<small>冷蔵庫の余り物を賢く消費</small></button>
                <button class="cat-btn" onclick="app.filterRecipes('recommend')">あなたへの提案<small>AIが厳選したおすすめ料理</small></button>
            </div>
            <h3 style="font-size:1.5rem; font-weight:900; margin-bottom:24px; display:inline-block; background:var(--surface); padding:8px 16px; border:3px solid var(--text); box-shadow:4px 4px 0px var(--text);">注目のレシピ</h3>
            <div id="recipe-list" class="recipe-grid"></div>
        `;
        this.renderRecipeList();
    },

    renderSearch(container) {
        container.innerHTML = `
            <h1>レシピ検索</h1>
            <div class="form-group">
                <input type="text" placeholder="食材や料理名を入力..." style="font-size:1.1rem; padding:16px;" onkeyup="if(event.key==='Enter') app.searchRecipes(this.value)"> //キーワード検索機能追加
            </div>
            <div class="search-categories">
                <button class="cat-btn" onclick="app.filterRecipes('time')">時短</button>
                <button class="cat-btn" onclick="app.filterRecipes('inventory')">所持食材</button>
                <button class="cat-btn" onclick="app.filterRecipes('recommend')">提案</button>
            </div>
            <div id="recipe-list" class="recipe-grid"></div>
        `;
        this.renderRecipeList();
    },

    renderCommunity(container) {
        container.innerHTML = `
        <h1>みんなの料理一覧</h1>
        <p style="margin-bottom:24px; font-weight:700; color:var(--text-secondary);">他のユーザーが完成させた料理がここに表示されます。</p>
        <div id="recipe-post" class="recipe-grid post-grid">
        </div>
        `;
        this.renderPostList();
    },
    togglePostLike(button, event) {
        if (event) event.stopPropagation();

        const image = button.querySelector('img');
        const isLiked = button.classList.toggle('is-liked');
        button.setAttribute('aria-pressed', String(isLiked));
        image.src = isLiked ? 'images/heart_onclick.png' : 'images/heart.png';
        // image.alt = isLiked ? 'いいね済み' : 'いいね';

        if (isLiked) {
            image.classList.remove('heart-pop');
            void image.offsetWidth;
            image.classList.add('heart-pop');
        }
    },
    // コミュニティ 投稿カード 生成
    // 後で場所変える
    renderPostList(){
        const list = document.getElementById('recipe-post');
        if (!list) return;
        list.innerHTML = '';

        // dbから投稿取得

        // 仮データ 
        const dbdata = [{
            name:"テスト1",recipe_name:"オムライス",photo_url:"images/omu.jpg",post_coment:"ふわふわオムライスができたー",cooking_time:"10分~20分"
        },
        {
            name:"テスト2",recipe_name:"ハンバーグ",photo_url:"images/Hamburg.jpg",post_coment:"手作りハンバーグが最強！",cooking_time:"10分~20分"
        }]
        // 整形
        dbdata.forEach(data => {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.innerHTML = `
            <div class="parent-container">
                <div class="usr-container"> <!-- ここのコンテナは全要素横並び-->
                    <div class="usr-box"><img src="images/usricon.png" alt="ユーザーアイコン"></div>
                    <div class="usr-box"><p class="post-user">${this.escapeHtml(data.name)}</p></div>
                    <div class="usr-box"><p class = "post-time">1時間前</p></div><!--右寄せ グレー文字-->
                </div>
                <p class="post-comment">${this.escapeHtml(data.post_coment)}</p>

                <!-- 料理詳細 画像と料理要素(料理名・調理時間・ボタン)を横並びにする-->
                <div class = "post-box">
                    <img class="post-image"
                         src="${this.escapeHtml(data.photo_url)}"
                        alt="${this.escapeHtml(data.recipe_name)}">
                </div>
                <div class ="post-box">
                    <h2 class="">${this.escapeHtml(data.recipe_name)}</h2>
                    <p class="post-time">調理時間: ${this.escapeHtml(data.cooking_time)}</p>
                    <button>レシピを見る</button>
                </div>
                
                <button class="good-button" type="button" aria-label="いいね" aria-pressed="false" onclick="app.togglePostLike(this, event)"><img src="images/heart.png"></button>
            </div>
                `;
            list.appendChild(card);
        });

    },
    //変更 コピペ推奨 6/16
    renderFavorites(container) {
        const favorites = this.ensureUserFavorites();
        if (!favorites.length) {
            container.innerHTML = `<h1>お気に入りレシピ</h1><p style="color:var(--text-secondary);">保存したレシピはまだありません。</p>`;
            return;
        }

        container.innerHTML = `
            <h1>お気に入りレシピ</h1>
            <p style="margin-bottom:24px; font-weight:700; color:var(--text-secondary);">保存したレシピをクリックすると詳細を開けます。</p>
            <div id="favorite-list" class="recipe-grid"></div>
        `;

        const list = document.getElementById('favorite-list');
        favorites.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.onclick = () => this.openRecipe(recipe);

            card.innerHTML = `
                <span class="tag time">${recipe.time || 0}分</span>
                <span class="tag">難易度 ${'★'.repeat(recipe.diff || 1)}</span>
                <h3 style="margin-top:12px;">${this.escapeHtml(this.getRecipeTitle(recipe))}</h3>
                <p>${this.escapeHtml(recipe.desc || '')}</p>
                <small style="color:var(--text-secondary); font-weight:700;">保存日: ${this.escapeHtml((recipe.savedAt || '').slice(0, 10) || '-')}</small>
            `;

            const action = document.createElement('div');
            action.className = 'recipe-card-actions';
            const button = document.createElement('button');
            button.className = 'btn btn-outline btn-sm';
            button.textContent = '★ 解除';
            button.onclick = (event) => this.toggleFavorite(recipe, event);
            action.appendChild(button);
            card.appendChild(action);
            list.appendChild(card);
        });
    },
    //ここまで

    renderAccount(container) {
        const u = this.state.currentUser;
        const charKey = u.equipped.character === 'char_cat' ? 'cat'
            : u.equipped.character === 'char_bear' ? 'bear'
            : u.equipped.character === 'char_dog' ? 'dog'
            : u.equipped.character === 'char_rabbit' ? 'rabbit' : 'default';

        let equipHtml = '<h4 style="margin:24px 0 12px; font-weight:900; font-size:1rem; background:var(--text); color:var(--surface); display:inline-block; padding:6px 12px;">キャラクター</h4><div class="equip-grid" style="margin-bottom:24px;">';
        equipHtml += `<div class="equip-item ${u.equipped.character === 'default' ? 'equipped' : ''}" onclick="app.equipItem('char', 'default')"><div class="icon">${this.chars.default}</div><div class="name">デフォルト</div></div>`;
        ['char_cat','char_bear','char_dog','char_rabbit'].forEach(id => {
            const item = this.storeItems.find(i => i.id === id);
            if (u.inventory.includes(id)) {
                equipHtml += `<div class="equip-item ${u.equipped.character === id ? 'equipped' : ''}" onclick="app.equipItem('char', '${id}')"><div class="icon">${this.chars[item.icon]}</div><div class="name">${item.name}</div></div>`;
            }
        });
        equipHtml += '</div>';

        equipHtml += '<h4 style="margin:24px 0 12px; font-weight:900; font-size:1rem; background:var(--text); color:var(--surface); display:inline-block; padding:6px 12px;">アクセサリー</h4><div class="equip-grid">';
        equipHtml += `<div class="equip-item ${u.equipped.accessory === null ? 'equipped' : ''}" onclick="app.equipItem('acc', null)"><div class="icon" style="font-size:36px; display:flex; align-items:center; justify-content:center;">❌</div><div class="name">なし</div></div>`;
        ['acc_hat','acc_glasses','acc_bow','acc_crown'].forEach(id => {
            const item = this.storeItems.find(i => i.id === id);
            if (u.inventory.includes(id)) {
                equipHtml += `<div class="equip-item ${u.equipped.accessory === id ? 'equipped' : ''}" onclick="app.equipItem('acc', '${id}')"><div class="icon" style="font-size:36px; display:flex; align-items:center; justify-content:center;">${item.icon}</div><div class="name">${item.name}</div></div>`;
            }
        });
        equipHtml += '</div>';

        let ingredientsHtml = '<div id="ingredients-list">';
        const ingList = u.ingredientsList || [{name: "", amount: ""}];
        ingList.forEach((ing, index) => {
            ingredientsHtml += `
                <div class="ingredient-row">
                    <input type="text" placeholder="食材名 (例: 玉ねぎ)" value="${ing.name}" class="ing-name" data-index="${index}">
                    <input type="text" placeholder="量 (例: 1個)" value="${ing.amount}" class="ing-amount" data-index="${index}">
                    <button class="btn btn-sm btn-danger" onclick="app.removeIngredientRow(${index})">削除</button>
                </div>
            `;
        });
        ingredientsHtml += '</div>';
        ingredientsHtml += `<button class="btn btn-outline btn-sm" onclick="app.addIngredientRow()" style="margin-top: 12px;">+ 食材を追加</button>`;

        container.innerHTML = `
            <h1>アカウント情報</h1>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:48px;">
                <div>
                    <h3 style="font-size:1.1rem; font-weight:900; margin-bottom:20px; border-bottom:3px solid var(--primary); display:inline-block;">プロフィール設定</h3>
                    <div class="form-group">
                        <label>アイコン画像</label>
                        <input type="file" accept="image/*" onchange="app.handleAvatarUpload(this)">
                        ${u.avatar ? `<img src="${u.avatar}" style="width:90px; margin-top:10px; border:3px solid var(--text); box-shadow:3px 3px 0px var(--text);">` : ''}
                    </div>
                    <div class="form-group">
                        <label>ユーザーネーム</label>
                        <input type="text" id="set-name" value="${u.name}">
                    </div>
                    <div class="form-group">
                        <label>メールアドレス</label>
                        <input type="email" id="set-email" value="${u.email}" disabled style="background:#eee;">
                    </div>
                    <div class="form-group">
                        <label>パスワード変更</label>
                        <input type="password" id="set-pass" placeholder="新しいパスワードを入力">
                    </div>
                    <h3 style="font-size:1.1rem; font-weight:900; margin:32px 0 20px; border-bottom:3px solid var(--primary); display:inline-block;">所持食材の登録</h3>
                    <p style="font-size:0.85rem; font-weight:700; margin-bottom:16px; background:var(--accent); padding:16px; border:3px solid var(--text); box-shadow:3px 3px 0px var(--text);">
                        冷蔵庫にある食材を登録すると、「所持食材で作れる」レシピ提案がより正確になります。<br>
                        <small style="opacity:0.8;">※「タマネギ」「玉ねぎ」「たまねぎ」などは自動で同じものとして認識されます。</small>
                    </p>
                    ${ingredientsHtml}
                    <div style="margin-top:32px;">
                        <button class="btn btn-primary" onclick="app.saveSettings()">すべて保存</button>
                        <button class="btn btn-outline" style="margin-left:16px;" onclick="app.logout()">ログアウト</button>
                    </div>
                </div>
                <div>
                    <h3 style="font-size:1.1rem; font-weight:900; margin-bottom:20px; border-bottom:3px solid var(--primary); display:inline-block;">装備管理</h3>
                    <p style="margin-bottom:16px; font-weight:700; color:var(--text-secondary);">購入したアイテムをクリックして適用してください。</p>
                    ${equipHtml}
                </div>
            </div>
        `;
    },

    renderSettings(container) {
        const u = this.state.currentUser;
        container.innerHTML = `
            <h1>システム設定</h1>
            <div style="max-width: 600px; background:var(--surface); padding:32px; border:3px solid var(--text); box-shadow:6px 6px 0px var(--text);">
                <div class="form-group">
                    <label>文字の大きさ</label>
                    <select id="set-fontsize" onchange="app.changeFontSize(this.value)">
                        <option value="14px" ${u.settings.fontSize === '14px' ? 'selected' : ''}>小</option>
                        <option value="16px" ${u.settings.fontSize === '16px' ? 'selected' : ''}>中 (標準)</option>
                        <option value="18px" ${u.settings.fontSize === '18px' ? 'selected' : ''}>大</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>通知設定</label>
                    <div style="display:flex; align-items:center; gap:12px; margin-top:8px;">
                        <input type="checkbox" id="set-notif" ${u.settings.notifications ? 'checked' : ''} style="width:20px; height:20px; accent-color:var(--primary);" onchange="app.toggleNotification(this.checked)">
                        <span style="font-weight:700;">料理の提案や継続日数の通知を受け取る</span>
                    </div>
                </div>
                <h3 style="font-size:1.1rem; font-weight:900; margin:48px 0 20px; border-bottom:3px solid var(--primary); display:inline-block;">データ管理</h3>
                <div style="display:flex; gap:16px; margin-bottom:24px;">
                    <button class="btn btn-outline" onclick="app.exportData()">📥 データをエクスポート</button>
                    <label class="btn btn-outline" style="cursor:pointer;">
                        📤 データをインポート
                        <input type="file" accept=".json" onchange="app.importData(this)" style="display:none;">
                    </label>
                </div>
                <div style="margin-top:48px; padding-top:24px; border-top:3px solid var(--border);">
                    <button class="btn btn-danger" onclick="app.deleteAccount()">アカウントを完全に削除</button>
                </div>
            </div>
        `;
    },

    renderStore(container) {
        let html = `<h1>ストア</h1><p style="margin-bottom:32px; font-size:1.1rem; font-weight:900;">所持DP: <strong style="color:var(--primary); font-size:2.2rem; text-shadow:2px 2px 0px var(--text);">${this.state.currentUser.dp}</strong></p><div class="store-grid">`;
        this.storeItems.forEach(item => {
            const owned = this.state.currentUser.inventory.includes(item.id);
            let iconHtml = item.type === 'char'
                ? `<div class="icon">${this.chars[item.icon]}</div>`
                : `<div class="icon" style="font-size:36px; display:flex; align-items:center; justify-content:center;">${item.icon}</div>`;
            html += `
                <div class="store-item ${owned ? 'owned' : ''}">
                    ${iconHtml}
                    <h3>${item.name}</h3>
                    <div class="price">${item.price} DP</div>
                    <button class="btn ${owned ? 'btn-outline' : 'btn-primary'}" style="width:100%; margin-top:12px;" ${owned ? 'disabled' : ''} onclick="app.buyItem('${item.id}', ${item.price}, '${item.type}')">
                        ${owned ? '所持済み' : '購入する'}
                    </button>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    },

    renderRecipeList() {
        const list = document.getElementById('recipe-list');
        if (!list) return;
        list.innerHTML = '';

        let displayData = this.state.recipes;
        if (this.state.currentFilter === 'time') {
            displayData = this.state.recipes.filter(r => r.time <= 30);
        } else if (this.state.currentFilter === 'inventory' && this.state.currentUser?.ingredientsList) {
            const userIngs = this.state.currentUser.ingredientsList
                .filter(ing => ing.name.trim() !== "")
                .map(ing => this.normalizeIngredient(ing.name));
            displayData = this.state.recipes.map(r => {
                let matchCount = 0;
                const recipeIngs = r.ingredients.map(ing => this.normalizeIngredient(ing));
                userIngs.forEach(uIng => {
                    if (recipeIngs.some(rIng => rIng.includes(uIng) || uIng.includes(rIng))) matchCount++;
                });
                return { ...r, matchCount };
            }).filter(r => r.matchCount > 0).sort((a, b) => b.matchCount - a.matchCount);
        }
        //変更点あり //変更 お気に入りボタン追加 6/20
        displayData.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.onclick = () => app.openRecipe(recipe);
            const title = this.getRecipeTitle(recipe); //ここ
            
            let matchTag = '';
            if (this.state.currentFilter === 'inventory' && recipe.matchCount) {
                matchTag = `<span class="tag match">所持食材 ${recipe.matchCount}個一致</span>`;
            }

            
            card.innerHTML = `
                ${matchTag}
                <span class="tag time">${recipe.time}分</span>
                <span class="tag">難易度 ${'★'.repeat(recipe.diff)}</span>
                <h3 style="margin-top:12px;">${this.escapeHtml(title)}</h3>
                <p>${this.escapeHtml(recipe.desc || '')}</p>
            `;
            const action = document.createElement('div');
            action.className = 'recipe-card-actions';
            const favButton = document.createElement('button');
            favButton.className = `btn btn-sm ${this.isFavorite(recipe) ? 'btn-primary' : 'btn-outline'}`;
            favButton.textContent = this.isFavorite(recipe) ? '★ 保存済み' : '☆ お気に入り';
            favButton.onclick = (event) => this.toggleFavorite(recipe, event);
            action.appendChild(favButton);
            card.appendChild(action);
            list.appendChild(card);
        });
    },
    
// 08/27 献立提案入力画面 恒川 実装：横田
    openMenuProposal() {
    if (!this.currentRecipe) {
        alert('先にレシピを選んでください。');
        this.navigate('search');
        return;
    }
    this.state.menuProposalGenre = '';
    this.state.menuProposal = {
        mode: 'form',
        values: {
            people: '2人',
            budget: '1000円以内',
            time: '30',
            genre: '',
            dislikedIngredients: '',
            cookingStyle: 'any',
            preferences: ''
        },
        result: null,
        warning: '',
        error: ''
    };
    this.navigate('menu-proposal');
},

selectMenuProposalGenre(genre) {
    this.state.menuProposalGenre = genre;
    if (this.state.menuProposal) {
        this.state.menuProposal.values.genre = genre;
    }
    document.querySelectorAll('.menu-genre-button').forEach(button => {
        button.classList.toggle('is-selected', button.dataset.genre === genre);
    });
},

getMenuProposalState() {
    if (!this.state.menuProposal) {
        this.state.menuProposal = {
            mode: 'form',
            values: {
                people: '2人',
                budget: '1000円以内',
                time: '30',
                genre: '',
                dislikedIngredients: '',
                cookingStyle: 'any',
                preferences: ''
            },
            result: null,
            warning: '',
            error: ''
        };
    }
    return this.state.menuProposal;
},

collectMenuProposalValues() {
    const proposal = this.getMenuProposalState();
    proposal.values = {
        people: document.getElementById('menu-people')?.value || proposal.values.people,
        budget: document.getElementById('menu-budget')?.value || proposal.values.budget,
        time: document.getElementById('menu-time')?.value || proposal.values.time,
        genre: this.state.menuProposalGenre || '',
        dislikedIngredients: document.getElementById('menu-ingredients')?.value.trim() || '',
        cookingStyle: document.getElementById('menu-cooking-style')?.value || proposal.values.cookingStyle || 'any',
        preferences: document.getElementById('menu-request')?.value.trim() || ''
    };
    return proposal.values;
},

findDislikedIngredientConflicts(dislikedIngredients) {
    const disliked = String(dislikedIngredients || '')
        .split(/[、,，\n]+/)
        .map(item => item.trim())
        .filter(Boolean);
    const recipeIngredients = Array.isArray(this.currentRecipe?.ingredients)
        ? this.currentRecipe.ingredients
        : [];

    return disliked.filter(item => {
        const normalizedDisliked = this.normalizeIngredient(item);
        if (!normalizedDisliked) return false;
        return recipeIngredients.some(ingredient => {
            const normalizedIngredient = this.normalizeIngredient(ingredient);
            return Boolean(normalizedIngredient)
                && (normalizedIngredient.includes(normalizedDisliked)
                    || normalizedDisliked.includes(normalizedIngredient));
        });
    });
},

async generateMenuProposal(readForm = true) {
    const proposal = this.getMenuProposalState();
    if (proposal.mode === 'loading') return;

    const values = readForm ? this.collectMenuProposalValues() : proposal.values;
    const selectedRecipe = this.normalizeRecipeSnapshot(this.currentRecipe);
    const fixedDishMeta = this.getDishTypeMeta(selectedRecipe.dishType);
    const generatedDishLabels = this.getGeneratedDishTypes(fixedDishMeta.key)
        .map(dishType => this.getDishTypeMeta(dishType).label);
    const conflicts = this.findDislikedIngredientConflicts(values.dislikedIngredients);
    proposal.warning = conflicts.length
        ? `固定する${fixedDishMeta.label}の材料に、苦手な食材「${conflicts.join('、')}」が含まれています。${fixedDishMeta.label}は変更せず、${generatedDishLabels.join('・')}では使わない条件で提案します。`
        : '';
    proposal.mode = 'loading';
    proposal.error = '';
    proposal.result = null;
    this.renderMenuProposal(document.getElementById('main-content'));

    try {
        const data = await this.apiFetch('/api/menu-proposal', {
            method: 'POST',
            auth: false,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe_name: selectedRecipe.title,
                fixed_dish_type: fixedDishMeta.key,
                ingredients: selectedRecipe.ingredients,
                people: values.people,
                budget: values.budget,
                cooking_time: `${values.time}分以内`,
                genre: values.genre,
                disliked_ingredients: values.dislikedIngredients,
                cooking_style: values.cookingStyle,
                preferences: values.preferences
            })
        });
        if (!Array.isArray(data.plans) || data.plans.length !== 4) {
            throw new Error('献立案を正しく受け取れませんでした。もう一度お試しください。');
        }
        const responseFixedDishType = this.normalizeDishType(data.selected_recipe?.dish_type)
            || fixedDishMeta.key;
        const responseGeneratedDishTypes = this.getGeneratedDishTypes(responseFixedDishType);
        const hasMissingDish = data.plans.some(plan =>
            responseGeneratedDishTypes.some(dishType => !String(plan?.[dishType] || '').trim())
        );
        if (hasMissingDish) {
            throw new Error('献立案に空欄があります。もう一度お試しください。');
        }

        proposal.result = data;
        proposal.mode = 'result';
    } catch (error) {
        proposal.error = error.message || '献立を生成できませんでした。';
        proposal.mode = 'error';
    }
    this.renderMenuProposal(document.getElementById('main-content'));
},

retryMenuProposal() {
    this.generateMenuProposal(false);
},

editMenuProposalConditions() {
    const proposal = this.getMenuProposalState();
    proposal.mode = 'form';
    proposal.error = '';
    proposal.result = null;
    this.state.menuProposalGenre = proposal.values.genre;
    this.renderMenuProposal(document.getElementById('main-content'));
},

renderMenuProposal(container) {
    const proposal = this.getMenuProposalState();
    const values = proposal.values;
    const genres = ['和食', '洋食', '中華', '韓国', 'イタリアン'];
    const peopleOptions = ['1人', '2人', '3〜4人', '5人以上'];
    const budgetOptions = ['500円以内', '1000円以内', '1500円以内', '指定なし'];
    const timeOptions = [
        { value: '15', label: '15分以内' },
        { value: '30', label: '30分以内' },
        { value: '45', label: '45分以内' },
        { value: '60', label: '60分以内' }
    ];
    const cookingStyleOptions = [
        { value: 'any', label: 'おまかせ', note: '器具の制限なし' },
        { value: 'one_pan', label: 'フライパン1つで', note: '洗い物を減らす' },
        { value: 'microwave_only', label: 'レンジのみで', note: '火を使わない' },
        { value: 'no_knife', label: '包丁不要で', note: '切る作業を減らす' }
    ];
    const selectedRecipe = this.normalizeRecipeSnapshot(this.currentRecipe);
    const resultFixedDishType = this.normalizeDishType(proposal.result?.selected_recipe?.dish_type);
    const fixedDishMeta = this.getDishTypeMeta(resultFixedDishType || selectedRecipe.dishType);
    const generatedDishTypes = this.getGeneratedDishTypes(fixedDishMeta.key);

    let content = '';
    if (proposal.mode === 'form') {
        content = `
            <h1>献立提案</h1>
            <p class="menu-proposal-lead">条件を入力して、AIにおすすめの献立を提案してもらおう！</p>
            <div class="menu-proposal-form">
                <label>■ 人数
                    <select id="menu-people">
                        ${peopleOptions.map(option => `<option ${values.people === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </label>
                <label>■ 予算
                    <select id="menu-budget">
                        ${budgetOptions.map(option => `<option ${values.budget === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </label>
                <label>■ 調理時間
                    <select id="menu-time">
                        ${timeOptions.map(option => `<option value="${option.value}" ${values.time === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                    </select>
                </label>
                <label>■ 調理スタイル
                    <select id="menu-cooking-style">
                        ${cookingStyleOptions.map(option => `<option value="${option.value}" ${values.cookingStyle === option.value ? 'selected' : ''}>${option.label}（${option.note}）</option>`).join('')}
                    </select>
                </label>
                <fieldset class="menu-genre-field"><legend>■ ジャンル</legend>
                    <div class="menu-genre-buttons">
                        ${genres.map(genre => `<button type="button" class="menu-genre-button ${values.genre === genre ? 'is-selected' : ''}" data-genre="${genre}" onclick="app.selectMenuProposalGenre('${genre}')">${genre}</button>`).join('')}
                    </div>
                </fieldset>
                <label>■ 苦手な食材
                    <input id="menu-ingredients" type="text" value="${this.escapeHtml(values.dislikedIngredients)}" placeholder="例：トマト、ピーマン">
                </label>
                <label>■ その他の希望
                    <textarea id="menu-request" rows="3" placeholder="例：野菜多め、ヘルシー、子供向け">${this.escapeHtml(values.preferences)}</textarea>
                </label>
                <p class="menu-proposal-note">予算と調理時間は、固定する${fixedDishMeta.label}を含む献立全体の目安です。調理スタイルは、固定料理以外のAI生成3品に反映されます。</p>
                <button class="btn btn-primary menu-proposal-submit" onclick="app.generateMenuProposal()">✦ AIに献立を作ってもらう</button>
            </div>
        `;
    } else if (proposal.mode === 'loading') {
        content = `
            <section class="menu-proposal-status" aria-live="polite" aria-busy="true">
                <div class="menu-proposal-spinner" aria-hidden="true"></div>
                <h1>Geminiが献立を考えています</h1>
                <p>「${this.escapeHtml(this.getRecipeTitle(this.currentRecipe))}」を${fixedDishMeta.label}として固定し、残り3品を4案作成中です。</p>
            </section>
        `;
    } else if (proposal.mode === 'error') {
        content = `
            <section class="menu-proposal-status menu-proposal-error" aria-live="assertive">
                <h1>献立を生成できませんでした</h1>
                <p>${this.escapeHtml(proposal.error)}</p>
                ${proposal.warning ? `<p class="menu-proposal-warning">${this.escapeHtml(proposal.warning)}</p>` : ''}
                <div class="menu-proposal-actions">
                    <button class="btn btn-primary" onclick="app.retryMenuProposal()">もう一度試す</button>
                    <button class="btn btn-outline" onclick="app.editMenuProposalConditions()">条件を変更する</button>
                </div>
            </section>
        `;
    } else {
        const selectedName = proposal.result?.selected_recipe?.name || this.getRecipeTitle(this.currentRecipe);
        content = `
            <section class="menu-proposal-result-page">
                <div class="menu-proposal-result-heading">
                    <h1>AIおすすめ献立 4案</h1>
                    <button class="btn btn-outline" onclick="app.editMenuProposalConditions()">条件を変更する</button>
                </div>
                <div class="menu-proposal-selected">
                    <div class="menu-proposal-selected-copy">
                        <span class="menu-proposal-label">最初に選んだ料理</span>
                        <strong>${this.escapeHtml(selectedName)}</strong>
                    </div>
                    <span class="dish-badge ${fixedDishMeta.badgeClass}">${fixedDishMeta.label}</span>
                    <span class="menu-proposal-selected-divider" aria-hidden="true"></span>
                    <b class="menu-proposal-selected-rule">${fixedDishMeta.label}・4案すべてに固定</b>
                    <span class="menu-proposal-fixed-badge">固定</span>
                </div>
                <div class="menu-proposal-condition">調理スタイル：${this.escapeHtml(({ any: 'おまかせ', one_pan: 'フライパン1つで', microwave_only: 'レンジのみで', no_knife: '包丁不要で' })[proposal.values.cookingStyle] || 'おまかせ')}</div>
                ${proposal.warning ? `<p class="menu-proposal-warning">${this.escapeHtml(proposal.warning)}</p>` : ''}
                <div class="menu-proposal-plans">
                    ${proposal.result.plans.map(plan => `
                        <article class="menu-proposal-plan">
                            <h2><span></span>献立案 ${Number(plan.id)}<span></span></h2>
                            <div class="menu-proposal-dishes">
                                ${generatedDishTypes.map(dishType => {
                                    const dishMeta = this.getDishTypeMeta(dishType);
                                    return `
                                        <div class="menu-proposal-dish">
                                            <span class="dish-badge ${dishMeta.badgeClass}">${dishMeta.label}</span>
                                            <strong>${this.escapeHtml(plan[dishType])}</strong>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </article>
                    `).join('')}
                </div>
            </section>
        `;
    }

    container.innerHTML = `
        <section class="menu-proposal-page">
            <button class="btn btn-outline menu-proposal-back" onclick="app.openRecipe(app.currentRecipe)">← レシピ詳細へ戻る</button>
            ${content}
        </section>
    `;
},

// ここまで
//ここまで
// 6/30 キーワード検索機能追加
    async searchRecipes(keyword) {
        this.state.recipes = [];
        this.state.displayedCount = 0;

        const recipe_list = await loadRecipe_json(keyword);

        this.state.recipes = recipe_list.map(base => ({
            id: base.recipe_id,
            title: base.name,
            main: base.main,
            category: base.category === 0 ? "料理" : "時短料理",
            time: base.time,
            diff: base.diff,
            desc: base.description,
            ingredients: JSON.parse(base.ingredients),
            steps: JSON.parse(base.steps)
        }));

        this.renderRecipeList();
    },

    currentRecipe: null,

    //ここから6/19
    openRecipe(recipe) {
        this.currentRecipe = recipe;
        const normalizedRecipe = this.normalizeRecipeSnapshot(recipe);

        const main = document.getElementById('main-content');
        main.innerHTML = `
            <button class="btn btn-outline" onclick="app.navigate('${this.state.currentView}')" style="margin-bottom:24px;">← 戻る</button>

            //お気に入り保存ボタン
            <div class="favorite-title-row">
                <h1 style="font-size:2.2rem;">${this.escapeHtml(normalizedRecipe.title)}</h1>
                ${this.renderFavoriteButton(normalizedRecipe)}
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:48px; margin-bottom:48px;">
                <div style="background:var(--surface); padding:32px; border:3px solid var(--text); box-shadow:5px 5px 0px var(--text);">
                    <h3 style="font-size:1.1rem; margin-bottom:16px; border-bottom:3px solid var(--primary); display:inline-block;">材料</h3>
                    <ul style="list-style:none; line-height:2.2; font-size:0.95rem; font-weight:700;">
                        ${recipe.ingredients.map(ing => `<li>・${ing}</li>`).join('')}
                    </ul>
                </div>
                <div style="background:var(--surface); padding:32px; border:3px solid var(--text); box-shadow:5px 5px 0px var(--text);">
                    <h3 style="font-size:1.1rem; margin-bottom:16px; border-bottom:3px solid var(--primary); display:inline-block;">手順</h3>
                    <ol style="line-height:2.2; padding-left:20px; font-size:0.95rem; font-weight:700;">
                        ${recipe.steps.map(s => `<li>${s}</li>`).join('')}
                    </ol>
                </div>
            </div>
            <div style="text-align:center; padding:48px; background:var(--accent); border:3px solid var(--text); box-shadow:8px 8px 0px var(--text);">
                <p style="font-size:1.1rem; font-weight:900; margin-bottom:24px; color:var(--text);">料理が完成したら写真を撮影して評価をもらい、キャラクターを成長させよう！</p>
                <button class="btn btn-primary" style="font-size:1.2rem; padding:16px 48px;" onclick="app.startCamera()">📷 完成！写真を撮る</button>
            </div>
        `;
    },

    startCamera() {
        
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const btnCapture = document.getElementById('btn-capture');
        const btnEvaluate = document.getElementById('btn-evaluate');
        const btnRetry = document.getElementById('btn-retry');
        const btnFinish = document.getElementById('btn-finish');
        const scoreDisplay = document.getElementById('score-display');
        const msg = document.getElementById('analysis-msg');
        const scanning = document.getElementById('ai-scanning');
        const feedback = document.getElementById('evaluation-feedback');

        console.log("modal", modal);
        console.log("video", video);
        console.log("canvas", canvas);
        console.log("btnCapture", btnCapture);
        console.log("btnEvaluate", btnEvaluate);
        console.log("btnRetry", btnRetry);
        console.log("btnFinish", btnFinish);
        console.log("scoreDisplay", scoreDisplay);
        console.log("msg", msg);
        console.log("scanning", scanning);
        console.log("feedback", feedback);

        modal.classList.add('active');
        scoreDisplay.style.display = 'none';
        scoreDisplay.innerText = '';
        feedback.style.display = 'none';
        feedback.innerHTML = '';
        btnCapture.style.display = 'inline-block';
        btnEvaluate.style.display = 'none';
        btnEvaluate.disabled = false;
        btnRetry.style.display = 'none';
        btnRetry.textContent = '🔄 写真を取り直す';
        btnFinish.style.display = 'none';
        btnFinish.textContent = 'この写真で完了';
        document.getElementById('btn-close-camera').style.display = 'inline-block';
        scanning.style.display = 'none';
        msg.style.display = 'block';
        msg.innerText = 'AIによる参考評価（試作版）です。料理をフレームの中央に写してください。';
        msg.style.background = 'var(--primary)';
        
        video.style.display = 'block';
        canvas.style.display = 'none';

        const facingMode = this.ensureUserSettings()?.cameraFacingMode || 'environment';
        navigator.mediaDevices.getUserMedia({ video: { facingMode } })
            .then(stream => {
                this.state.stream = stream;
                video.srcObject = stream;
            })
            .catch(err => {
                console.error(err);
                video.style.display = 'none';
                btnCapture.style.display = 'none';
                btnRetry.style.display = 'none';
                btnEvaluate.style.display = 'none';
                msg.innerText = 'カメラにアクセスできませんでした。権限を確認するか、localhost環境で実行してください。';
                msg.style.background = '#FF4757';
            });
    },

    capturePhoto() {
        const video = document.getElementById('camera-video');
        const canvas = document.getElementById('camera-canvas');
        const btnCapture = document.getElementById('btn-capture');
        const btnRetry = document.getElementById('btn-retry');
        const msg = document.getElementById('analysis-msg');
        const scanning = document.getElementById('ai-scanning');

        if (!video.videoWidth || !video.videoHeight) {
            msg.innerText = 'カメラ映像の準備がまだできていません。少し待ってから撮影してください。';
            msg.style.background = '#FF4757';
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        video.style.display = 'none';
        canvas.style.display = 'block';
        btnCapture.style.display = 'none';
        scanning.style.display = 'none';
        msg.innerText = '撮影しました。「評価する」を押すとAIによる参考評価を行います。';
        msg.style.background = '#2D6A4F';
        btnRetry.style.display = 'inline-block';
        document.getElementById('btn-evaluate').style.display = 'inline-block';
        document.getElementById('btn-close-camera').style.display = 'inline-block';
        this.stopCameraStream();
    },

    stopCameraStream() {
        if (this.state.stream) {
            this.state.stream.getTracks().forEach(track => track.stop());
            this.state.stream = null;
        }
    },

    // 緩和された画像解析ロジック
    analyzeImage(canvas) {
        const ctx = canvas.getContext('2d');
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 100;
        tempCanvas.height = 100;
        const tCtx = tempCanvas.getContext('2d');
        tCtx.drawImage(canvas, 0, 0, 100, 100);
        
        const imageData = tCtx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        const pixelCount = data.length / 4;
        
        let skinColorCount = 0;
        let foodColorCount = 0;
        let edgeCount = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            // 肌色検出
            if (r > 160 && g > 100 && b > 80 && r > g && g > b && (r - b) > 40) {
                skinColorCount++;
            }
            
            // 料理色検出
            const isGreen = g > 80 && g > r * 1.1 && g > b * 1.1;
            const isRed = r > 120 && r > g * 1.2 && b < 120;
            const isOrange = r > 120 && g > 80 && b < 100 && r > g;
            const isBrown = r > 80 && g > 40 && b < 80 && r > g && g > b;
            const isYellow = r > 150 && g > 150 && b < 100;
            
            if (isGreen || isRed || isOrange || isBrown || isYellow) {
                foodColorCount++;
            }
        }
        
        const skinRatio = skinColorCount / pixelCount;
        const foodRatio = foodColorCount / pixelCount;
        
        // エッジ密度
        const width = 100;
        const height = 100;
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const rightIdx = (y * width + (x + 1)) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                
                const currentGray = (data[idx] + data[idx+1] + data[idx+2]) / 3;
                const rightGray = (data[rightIdx] + data[rightIdx+1] + data[rightIdx+2]) / 3;
                const bottomGray = (data[bottomIdx] + data[bottomIdx+1] + data[bottomIdx+2]) / 3;
                
                if (Math.abs(currentGray - rightGray) > 20 || Math.abs(currentGray - bottomGray) > 20) {
                    edgeCount++;
                }
            }
        }
        const edgeRatio = edgeCount / ((width - 2) * (height - 2));
        
        // 判定ロジック
        if (skinRatio > 0.40 && edgeRatio < 0.20) {
            return { isValid: false, reason: "face", complexityScore: 0 };
        }
        
        if (edgeRatio < 0.08) {
            return { isValid: false, reason: "low_edge", complexityScore: 0 };
        }
        
        if (edgeRatio > 0.08 && foodRatio > 0.05) {
            let score = 7;
            if (edgeRatio > 0.25) score = 10;
            else if (edgeRatio > 0.18) score = 9;
            else if (edgeRatio > 0.12) score = 8;
            
            return { isValid: true, reason: "ok", complexityScore: Math.round(edgeRatio * 100) };
        }
        
        return { isValid: true, reason: "ok", complexityScore: 70 };
    },

    retryCamera() {
        this.startCamera();
    },

    getCompressedImageData(canvas) {
        const maxSide = 768;
        const scale = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = Math.max(1, Math.round(canvas.width * scale));
        outputCanvas.height = Math.max(1, Math.round(canvas.height * scale));
        outputCanvas.getContext('2d').drawImage(canvas, 0, 0, outputCanvas.width, outputCanvas.height);
        return outputCanvas.toDataURL('image/jpeg', 0.65);
    },

    escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    },

    shouldRecommendRetake(result) {
        const score = Number(result?.score);
        return !result?.is_food || !Number.isFinite(score) || score <= 0 || result?.match_level === 'low';
    },

    renderRetakePanel(result) {
        const shouldRetake = this.shouldRecommendRetake(result);
        const comment = result?.comment || 'AI評価結果を確認して、必要ならもう一度撮影してください。';
        const title = shouldRetake
            ? '料理が写るようにもう一度撮影してください'
            : 'この写真でよければ完了、撮り直すこともできます';
        const lead = shouldRetake
            ? '今回の写真は料理として判断しにくい、または料理名との一致が低い可能性があります。'
            : '写真に納得できない場合は、完了前に何度でも撮り直せます。';

        return `
            <div class="retake-panel ${shouldRetake ? 'retake-panel-warning' : ''}">
                <h4>${this.escapeHtml(title)}</h4>
                <p>${this.escapeHtml(lead)}</p>
                <p><strong>現在の判定:</strong> ${this.escapeHtml(comment)}</p>
                <ul>
                    <li>料理をフレームの中央に大きく写してください。</li>
                    <li>人の顔や飲み物だけが中心にならないようにしてください。</li>
                    <li>明るい場所で、料理全体が見える角度にすると判定しやすくなります。</li>
                </ul>
            </div>
        `;
    },

    renderEvaluationResult(result) {
        const scoreDisplay = document.getElementById('score-display');
        const feedback = document.getElementById('evaluation-feedback');
        const settings = this.ensureUserSettings() || this.defaultSettings;
        const matchLabels = {
            high: 'かなり一致',
            medium: 'やや一致',
            low: 'あまり一致していない',
            unknown: '判定不明'
        };

        scoreDisplay.innerText = `${result.score} / 10`;
        scoreDisplay.style.display = 'block';

        let detailHtml = `
            <h3>AIによる参考評価（試作版）</h3>
            <p><strong>コメント:</strong> ${this.escapeHtml(result.comment)}</p>
        `;
        if (settings.aiResultDetail !== 'simple') {
            detailHtml += `
                <p><strong>料理名:</strong> ${this.escapeHtml(result.expected_recipe)}</p>
                <p><strong>料理写真:</strong> ${result.is_food ? '料理として判定' : '料理ではない可能性あり'}</p>
                <p><strong>検出:</strong> ${this.escapeHtml(result.detected_dish)}</p>
                <p><strong>一致度:</strong> ${this.escapeHtml(matchLabels[result.match_level] || result.match_level || '判定不明')}</p>
                <p><strong>改善アドバイス:</strong> ${this.escapeHtml(result.advice)}</p>
            `;
        }
        if (settings.aiResultDetail === 'detailed' && settings.showAiTiming && result.debug_timing_ms) {
            detailHtml += `<p><strong>処理時間:</strong> AI ${this.escapeHtml(result.debug_timing_ms.ollama)}ms / 合計 ${this.escapeHtml(result.debug_timing_ms.total)}ms</p>`;
        } else if (settings.showAiTiming && result.debug_timing_ms) {
            detailHtml += `<p><strong>処理時間:</strong> ${this.escapeHtml(result.debug_timing_ms.total)}ms</p>`;
        }
        detailHtml += `<p class="note">この点数はAIによる参考評価です。評価基準は今後チームで調整予定です。</p>`;
        detailHtml += this.renderRetakePanel(result);
        feedback.innerHTML = detailHtml;
        feedback.style.display = 'block';
    },

    applyCookingReward(score) {
        const rewardScore = Math.max(0, Math.round(score));
        const expGain = rewardScore * 10;
        const dpGain = rewardScore * 5;
        const btnFinish = document.getElementById('btn-finish');
        btnFinish.style.display = 'inline-block';
        btnFinish.textContent = 'この写真で完了';
        btnFinish.onclick = () => {
            if (!this.state.currentUser) {
                this.closeCamera();
                alert('ログイン情報が見つからないため、経験値とDPは更新されませんでした。');
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            if (this.state.currentUser.lastCookDate !== today) {
                const lastDate = new Date(this.state.currentUser.lastCookDate);
                const diffTime = Math.abs(new Date(today) - lastDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays === 1 || this.state.currentUser.lastCookDate === null) {
                    this.state.currentUser.streak += 1;
                } else {
                    this.state.currentUser.streak = 1;
                }
                this.state.currentUser.lastCookDate = today;
            }

            this.state.currentUser.exp += expGain;
            this.state.currentUser.dp += dpGain;
            
            if (this.state.currentUser.exp >= this.state.currentUser.maxExp) {
                this.state.currentUser.level += 1;
                this.state.currentUser.exp = 0;
                this.state.currentUser.maxExp = Math.floor(this.state.currentUser.maxExp * 1.5);
                alert('🎉 レベルアップ！');
            }
            
            this.saveUser();
            this.closeCamera();
            alert(`AI参考評価: ${score}点\n獲得経験値: +${expGain}\n獲得DP: +${dpGain}\n継続日数: ${this.state.currentUser.streak}日`);
            this.navigate('home');
        };
    },

    async evaluateDish() {
        const canvas = document.getElementById('camera-canvas');
        const msg = document.getElementById('analysis-msg');
        const scanning = document.getElementById('ai-scanning');
        const btnEvaluate = document.getElementById('btn-evaluate');
        const btnRetry = document.getElementById('btn-retry');
        const btnFinish = document.getElementById('btn-finish');
        const btnCloseCamera = document.getElementById('btn-close-camera');
        const recipeName = this.currentRecipe?.title || this.currentRecipe?.name || document.querySelector('#main-content h1')?.innerText || '';

        if (!canvas.width || !canvas.height) {
            msg.style.display = 'block';
            msg.style.background = '#FF4757';
            msg.innerText = '評価する画像がありません。撮影するか画像を選んでください。';
            return;
        }

        let imageBase64;
        try {
            imageBase64 = this.getCompressedImageData(canvas);
        } catch (error) {
            console.error(error);
            msg.style.display = 'block';
            msg.style.background = '#FF4757';
            msg.innerText = '画像の圧縮に失敗しました。もう一度撮影してください。';
            return;
        }

        btnEvaluate.disabled = true;
        scanning.style.display = 'block';
        msg.style.display = 'block';
        msg.style.background = 'var(--primary)';
        msg.innerText = 'AIが軽量化した料理写真を評価中です...';
        document.getElementById('evaluation-feedback').style.display = 'none';
        document.getElementById('score-display').style.display = 'none';
        btnFinish.style.display = 'none';

        try {
            const response = await fetch('http://localhost:5000/api/food-evaluation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipe_name: recipeName,
                    image_base64: imageBase64
                })
            });
            const result = await response.json().catch(() => null);
            if (!response.ok || !result || result.error) {
                throw new Error(result?.message || 'AI評価に失敗しました。');
            }

            this.renderEvaluationResult(result);
            msg.style.background = '#2D6A4F';
            msg.innerText = 'AIによる参考評価が完了しました。';
            btnEvaluate.style.display = 'none';
            btnRetry.style.display = 'inline-block';
            btnRetry.textContent = '🔄 写真を取り直す';
            if (result.is_food && Number(result.score) > 0) {
                btnCloseCamera.style.display = 'none';
                this.applyCookingReward(Number(result.score) || 0);
            } else {
                btnFinish.style.display = 'none';
                btnCloseCamera.style.display = 'inline-block';
            }
        } catch (error) {
            console.error(error);
            msg.style.background = '#FF4757';
            msg.innerText = `AI評価に失敗しました。${error.message}`;
            btnEvaluate.disabled = false;
            btnRetry.style.display = 'inline-block';
            btnRetry.textContent = '🔄 写真を取り直す';
            btnFinish.style.display = 'none';
            btnCloseCamera.style.display = 'inline-block';
            const feedback = document.getElementById('evaluation-feedback');
            feedback.innerHTML = this.renderRetakePanel({
                is_food: false,
                score: 0,
                match_level: 'unknown',
                comment: `AI評価に失敗しました。${error.message || ''}`
            });
            feedback.style.display = 'block';
        } finally {
            scanning.style.display = 'none';
        }
    },

    finishCameraFlow() {
        this.closeCamera();
        this.navigate('home');
    },

    closeCamera() {
        const modal = document.getElementById('camera-modal');
        modal.classList.remove('active');
        document.getElementById('analysis-msg').style.display = 'block';
        this.stopCameraStream();
    },
//ここまでカメラ機能 6/19


    addIngredientRow() {
        if (!this.state.currentUser) return;
        this.state.currentUser.ingredientsList.push({name: "", amount: ""});
        this.renderAccount(document.getElementById('main-content'));
    },

    removeIngredientRow(index) {
        if (!this.state.currentUser) return;
        this.state.currentUser.ingredientsList.splice(index, 1);
        this.renderAccount(document.getElementById('main-content'));
    },

    handleAvatarUpload(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.state.currentUser.avatar = e.target.result;
                this.saveUser();
                this.renderAccount(document.getElementById('main-content'));
            };
            reader.readAsDataURL(input.files[0]);
        }
    },

    saveSettings() {
        this.state.currentUser.name = document.getElementById('set-name').value.trim();
        const newPass = document.getElementById('set-pass').value.trim();
        if (newPass) this.state.currentUser.password = newPass;
        const ingRows = document.querySelectorAll('.ingredient-row');
        const newIngredientsList = [];
        ingRows.forEach(row => {
            const name = row.querySelector('.ing-name').value.trim();
            const amount = row.querySelector('.ing-amount').value.trim();
            if (name) newIngredientsList.push({ name, amount });
        });
        this.state.currentUser.ingredientsList = newIngredientsList;
        this.saveUser();
        alert('設定を保存しました。');
        this.navigate('home');
    },

    changeFontSize(size) {
        this.state.currentUser.settings.fontSize = size;
        document.documentElement.style.setProperty('--font-size-base', size);
        this.saveUser();
    },

    toggleNotification(enabled) {
        this.state.currentUser.settings.notifications = enabled;
        this.saveUser();
    },

    exportData() {
        const dataStr = JSON.stringify(this.state.currentUser, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'miru-navi-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (data.email && data.name) {
                        this.state.currentUser = data;
                        this.saveUser();
                        alert('データを正常にインポートしました。');
                        this.navigate('home');
                    } else {
                        alert('無効なデータ形式です。');
                    }
                } catch (err) {
                    alert('ファイルの読み込みに失敗しました。');
                }
            };
            reader.readAsText(input.files[0]);
        }
    },

    deleteAccount() {
        if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
            const users = JSON.parse(localStorage.getItem('miruNaviUsers') || '[]');
            const filtered = users.filter(u => u.email !== this.state.currentUser.email);
            localStorage.setItem('miruNaviUsers', JSON.stringify(filtered));
            this.logout();
            alert('アカウントを削除しました。');
        }
    },

    equipItem(type, itemId) {
        if (type === 'char') this.state.currentUser.equipped.character = itemId === 'default' ? 'default' : itemId;
        else if (type === 'acc') this.state.currentUser.equipped.accessory = itemId;
        this.saveUser();
        this.renderAccount(document.getElementById('main-content'));
    },

    buyItem(itemId, price, type) {
        if (this.state.currentUser.dp >= price) {
            this.state.currentUser.dp -= price;
            this.state.currentUser.inventory.push(itemId);
            if (type === 'char') this.state.currentUser.equipped.character = itemId;
            if (type === 'acc') this.state.currentUser.equipped.accessory = itemId;
            this.saveUser();
            this.renderStore(document.getElementById('main-content'));
            alert('購入し、自動的に適用しました！');
        } else {
            alert('DPが不足しています。料理を完成させてDPを稼ぎましょう！');
        }
    },

    updateCharacterUI() {
        if (!this.state.currentUser) return;
        const u = this.state.currentUser;
        document.getElementById('char-level').innerText = u.level;
        document.getElementById('char-name').innerText = u.name;
        document.getElementById('char-dp').innerText = u.dp;
        document.getElementById('streak-badge').innerText = `🔥 ${u.streak}日`;
        const expPercent = (u.exp / u.maxExp) * 100;
        document.getElementById('char-exp-bar').style.width = `${expPercent}%`;

        const charKey = u.equipped.character === 'char_cat' ? 'cat'
            : u.equipped.character === 'char_bear' ? 'bear'
            : u.equipped.character === 'char_dog' ? 'dog'
            : u.equipped.character === 'char_rabbit' ? 'rabbit' : 'default';
        const avatar = document.getElementById('char-avatar');
        avatar.innerHTML = this.chars[charKey] + `<span class="character-accessory" id="char-accessory"></span>`;

        const acc = document.getElementById('char-accessory');
        acc.innerText = u.equipped.accessory === 'acc_hat' ? '👨‍🍳'
            : u.equipped.accessory === 'acc_glasses' ? '🕶️'
            : u.equipped.accessory === 'acc_bow' ? '🎀'
            : u.equipped.accessory === 'acc_crown' ? '👑' : '';
    }
};

window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
