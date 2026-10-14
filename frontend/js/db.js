

async function loadUser() {
    try{
        
        const response = await fetch(
            "http://localhost:5000/users"
        );

        const data = await response.json();

        document.getElementById("dbResult").innerHTML = 
        data[0].name;
        console.log(data)
    }
    catch(error){
        console.error(error);

        alert(error);
    }
}
//レシピの読み込み 6/30 キーワード検索でレシピを取得するAPIエンドポイントに変更
async function loadRecipe_json(keyword = "") {
    try {
        const url = keyword
            ? `http://localhost:5000/api/getRecipe?keyword=${encodeURIComponent(keyword)}`
            : "http://localhost:5000/api/getRecipe";

        const response = await fetch(url);
        const data = await response.json();

        console.log(data);
        return data;
    } catch (error) {
        console.error(error);
        alert(error);
        return [];
    }
}
