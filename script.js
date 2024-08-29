document.addEventListener('DOMContentLoaded', function() {

    $PERMISSAO_RELOAD = true;

    const cryptoContainer = document.getElementById('crypto-container');

    // Função para recarregar a página a cada 30 segundos (30000 milissegundos)
    function autoReload() {
        setTimeout(function(){
            if($PERMISSAO_RELOAD) location.reload();
        }, 60000); // 60 segundos
    }

    // Função para obter parâmetros da URL
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const cryptos = params.get('cryptos') ? params.get('cryptos').split(',') : [];
        const purchasePrices = params.get('prices') ? params.get('prices').split(',').map(Number) : [];
        const montantes = params.get('montantes') ? params.get('montantes').split(',').map(Number) : [];
        const corretoras = params.get('corretoras') ? params.get('corretoras').split(',') : [];
        const liquid_prices = params.get('liquidprice') ? params.get('liquidprice').split(',').map(Number) : [];
        const alavancagens = params.get('alavancagem') ? params.get('alavancagem').split(',').map(Number) : [];
        const currency = params.get('currency') && params.get('currency').length > 2 ? String(params.get('currency')) : 'usd';
        return { cryptos, purchasePrices, montantes, corretoras, liquid_prices, alavancagens, currency };
    }

    // Função para calcular a variação percentual do lucro
    function calculateProfitPercentage(currentPrice, purchasePrice) {
        return ((currentPrice - purchasePrice) / purchasePrice * 100).toFixed(2);
    }

    // Função para definir o fundo com base na variação percentual
    function getBackgroundColor(profitPercentage) {
        let color;
        if (isNaN(profitPercentage) || !isFinite(profitPercentage)) color = 'linear-gradient(135deg, #46a6fa, #1644e0)';
        else if (profitPercentage > 0) color = 'linear-gradient(135deg, #33ff33, #336633)';
        else color = 'linear-gradient(135deg, #ff9966, #cc1133)';
        return color;
    }

    const fetchCryptoData = async () => {
        const { cryptos, purchasePrices, montantes, corretoras, liquid_prices, alavancagens, currency } = getUrlParams();

        if (cryptos.length === 0 || (purchasePrices.length > 0 && cryptos.length !== purchasePrices.length) || (montantes.length > 0 && cryptos.length !== montantes.length) || (corretoras.length > 0 && cryptos.length !== corretoras.length) || (liquid_prices.length > 0 && cryptos.length !== liquid_prices.length) || (alavancagens.length > 0 && cryptos.length !== alavancagens.length) || !currency) {
            cryptoContainer.innerHTML = '<p class="my-5">Por favor, forneça parâmetros válidos na URL.<br>(cryptos, currency, prices, montantes)</p>';
            const newUrl = `${window.location.origin}${window.location.pathname}?cryptos=bitcoin,ethereum&prices=&montantes=&corretoras=&liquidprice=&alavancagem=&currency=usd`;
            window.location.href = newUrl;
            return;
        }

        try {
            /*// Fetch basic price data
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptos.join(',')}&vs_currencies=${currency}`);
            const data = await response.json();*/

            const response_moedas = await fetch(`https://api.coingecko.com/api/v3/coins/list`);
            const data_moedas = await response_moedas.json();
            $LISTA_MOEDAS = []
            const lista_moedas_dados = data_moedas.reduce((acc, corr) => {
                acc[corr.id] = corr;
                $LISTA_MOEDAS.push(corr.id);
                return acc;
            }, {});
            console.log($LISTA_MOEDAS);
            
            const response = await fetch(`https://api.coingecko.com/api/v3/exchanges?ids=${cryptos.join(',')}&vs_currencies=${currency}`);
            const response_data = await response.json();
            $LISTA_CORRETORAS = [];
            const corretoras_data = response_data.reduce((acc, corr) => {
                /*
                id: "bybit_spot",
                name: "Bybit",
                year_established: 2018,
                country: "British Virgin Islands",
                description: "Bybit is a cryptocurrency exchange that offers a professional platform featuring an ultra-fast matching engine, excellent customer service and multilingual community support for crypto traders of all levels. Established in March 2018, Bybit currently serves more than 10 million users and institutions offering access to over 100 assets and contracts across Spot, Futures and Options, launchpad projects, earn products, an NFT Marketplace and more. Bybit is a proud partner of Formula One racing team, Oracle Red Bull Racing, esports teams NAVI, Astralis, Alliance, Virtus.pro, Made in Brazil (MIBR), City Esports, and Oracle Red Bull Racing Esports, and association football (soccer) teams Borussia Dortmund and Avispa Fukuoka.",
                url: "https://www.bybit.com",
                image: "https://coin-images.coingecko.com/markets/images/698/small/bybit_spot.png?1706864649",
                has_trading_incentive: false,
                trust_score: 10,
                trust_score_rank: 1,
                trade_volume_24h_btc: 57224.41602283297,
                trade_volume_24h_btc_normalized: 39578.70338819684
                */
                acc[corr.id] = corr;
                $LISTA_CORRETORAS.push(corr.id);
                return acc;
            }, {});
            console.log(corretoras_data);

            // Fetch metadata for icons
            const metadataResponse = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${cryptos.join(',')}`);
            const metadata = await metadataResponse.json();
            const data = metadata.reduce((acc, coin) => {
                /*
                id: "bitcoin",
                symbol: "btc",
                name: "Bitcoin",
                image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1696501400",
                current_price: 65560,
                market_cap: 1292626797566,
                market_cap_rank: 1,
                fully_diluted_valuation: 1376984123506,
                total_volume: 19104176159,
                high_24h: 66993,
                low_24h: 65519,
                price_change_24h: -1001.7899278609548,
                price_change_percentage_24h: -1.50506,
                market_cap_change_24h: -19758946903.1084,
                market_cap_change_percentage_24h: -1.50557,
                circulating_supply: 19713490,
                total_supply: 21000000,
                max_supply: 21000000,
                ath: 73738,
                ath_change_percentage: -10.88544,
                ath_date: "2024-03-14T07:10:36.635Z",
                atl: 67.81,
                atl_change_percentage: 96806.36541,
                atl_date: "2013-07-06T00:00:00.000Z",
                roi: null,
                last_updated: "2024-06-17T12:33:54.693Z"
                */
                acc[coin.id] = coin;
                return acc;
            }, {});
            console.log(data);

            $('#titulo-container').html(`Cotações de Criptomoedas (${currency.toUpperCase()})`);

            cryptos.forEach((crypto, index) => {
                const currentPrice = data[crypto]['current_price'];
                const purchasePrice = purchasePrices[index];
                const montante = montantes[index];
                const profitPercentage = calculateProfitPercentage(currentPrice, purchasePrice);
                const corretora = corretoras_data[corretoras[index]];
                const liquidprice = liquid_prices[index];
                const alavancagem = alavancagens[index];
                //const profitValue = ((currentPrice - purchasePrice) * montante).toFixed(2);

                const cryptoElement = document.createElement('div');
                cryptoElement.className = 'crypto';
                cryptoElement.style.background = getBackgroundColor(profitPercentage);
                cryptoElement.innerHTML = `
                    <a href="https://www.coingecko.com/en/coins/${crypto}#panel" target="_blank">
                        <h3 class="me-4" title="${data[crypto]['symbol']} - ${data[crypto]['id']}">${data[crypto]['name']}</h3>
                        <img src="${data[crypto]['image']}" alt="${crypto} icon" class="img-crypto">
                        <h5>${currentPrice}</h5>
                        <hr class="mb-0">
                        <span title="Variação de preço em 24h">Preço 24h: ${data[crypto]['price_change_percentage_24h']}%</span>
                        ${purchasePrice > 0 ? '<p>Preço Médio: '+purchasePrice+'</p>' : ''}
                        ${montante > 0 ? '<p>Montante: '+montante+'</p>' : ''}
                        ${!isNaN(profitPercentage) && isFinite(profitPercentage) ? '<p>Lucro: <b style="font-size: 14px">'+profitPercentage+'%</b></p>' : ''}
                        ${liquidprice ? `<p title="Preço Estimado para liquidação">Liquidação: ${liquidprice}</p>` : ''}
                    </a>
                    ${corretora && corretora['image'] ? `<a href="${corretora['url']}" target="_blank"><img src="${corretora['image']}" alt="${corretora['name']}" class="img-corretora"></a>` : ''}
                    ${alavancagem && alavancagem > 1 ? `<div class="crypto_alavancagem" title="Mercado Futuros, Alavancagem de ${alavancagem}x">${alavancagem}x</div>` : ''}
                `;
                cryptoContainer.appendChild(cryptoElement);
            });

        } catch (error) {
            console.error('Erro ao buscar dados da API do CoinGecko', error);
            cryptoContainer.innerHTML = '<p>Erro ao carregar dados,talvez muitas requesições ou parâmetros errados, espere e tente novamente</p>';
        }
    };

    function criar_row_form(cryptoTableBody, i="", c="", p="", m="", cc="", l="", a=""){
        const row = document.createElement('tr');
        row.setAttribute('nr_index', i);
        row.setAttribute('draggable', true);
        row.innerHTML = `
            <td>
                <input id="cryptos_${i}" type="text" class="form-control mb-1" name="cryptos[]" value="${c}" list="list_cryptos" title="ID da Crypto">
                <datalist id="list_cryptos"></datalist>
                <input id="corretoras_${i}" type="text" class="form-control" name="corretoras[]" value="${cc}" list="list_corretoras" title="Nome da Corretora">
                <datalist id="list_corretoras"></datalist>
            </td>
            <td>
                <input type="text" class="form-control mb-1" name="prices[]" value="${p}" title="Preço Médio de Compra">
                <input type="text" class="form-control" name="liquid_prices[]" value="${l}" title="Preço para Liquidação">
            </td>
            <td>
                <input type="text" class="form-control mb-1" name="montantes[]" value="${m}" title="Montante">
                <input type="text" class="form-control" name="alavancagens[]" value="${a}" title="Alavancagem em X">
            </td>
            <td class="d-flex flex-column justify-content-center align-items-center">
                <button id="bt-del-row-form-${i}" nr_index="${i}" type="button" class="bt-del-row-form btn-close"></button>
            </td>
        `;
        cryptoTableBody.appendChild(row);

        $(`#bt-del-row-form-${i}`).click(function(){
            console.log('d', $(this).attr("nr_index"));
            $(`tr[nr_index=${i}]`).remove();

        });

        $(`#cryptos_${i}`).on('input', function() {
            var input = this.value;
            if (input.length >= 3) fetchSuggestions(input, $LISTA_MOEDAS, "list_cryptos");
            else clearSuggestions("list_cryptos");
        });

        $(`#corretoras_${i}`).on('input', function() {
            var input = this.value;
            if (input.length >= 3) fetchSuggestions(input, $LISTA_CORRETORAS, "list_corretoras");
            else clearSuggestions("list_corretoras");
        });
    }

    function open_form_new_crypto(){

        const { cryptos, purchasePrices, montantes, corretoras, liquid_prices, alavancagens, currency } = getUrlParams();
        const cryptoTableBody = document.getElementById('cryptoTableBody');
        cryptoTableBody.innerHTML='';
        cryptos.forEach((crypto, index) => {
            criar_row_form(cryptoTableBody, index, crypto, purchasePrices[index], montantes[index], corretoras[index], liquid_prices[index], alavancagens[index]);
        });
        $("#addRow").attr("nr_index", cryptos.length);
        $("#form-crypto-select").val(currency.toLowerCase());

        const table = document.getElementById('draggableTable');
        let draggedRow = null;

        table.addEventListener('dragstart', (event) => {
            draggedRow = event.target;
            event.target.classList.add('dragging');
        });

        table.addEventListener('dragend', (event) => {
            event.target.classList.remove('dragging');
            draggedRow = null;
        });

        table.addEventListener('dragover', (event) => {
        event.preventDefault();
        const target = event.target.closest('tr');
        if (target && target !== draggedRow) {
            const rect = target.getBoundingClientRect();
            const next = (event.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
            table.querySelector('tbody').insertBefore(draggedRow, next && target.nextSibling || target);
        }
        });
    }

    function fetchSuggestions(query, suggestions, datalist) {
        //var suggestions = ['apple', 'banana', 'grape', 'orange', 'pineapple', 'strawberry', 'watermelon']; // Sugestões de exemplo
        var filteredSuggestions = suggestions.filter(function(item) {
            return item.toLowerCase().includes(query.toLowerCase());
        });
    
        updateDatalist(filteredSuggestions, datalist);
    }
    
    function updateDatalist(options, datalist_id) {
        var datalist = document.getElementById(datalist_id);
        datalist.innerHTML = '';
    
        options.forEach(function(item) {
            var option = document.createElement('option');
            option.value = item;
            datalist.appendChild(option);
        });
    }
    
    function clearSuggestions(datalist_id) {
        var datalist = document.getElementById(datalist_id);
        datalist.innerHTML = '';
    }

    //EVENTOS

    $('#addRow').click(function () {
        $nr_index = parseInt($("#addRow").attr("nr_index")) + 1;
        const cryptoTableBody = document.getElementById('cryptoTableBody');
        criar_row_form(cryptoTableBody, $nr_index);
        $("#addRow").attr("nr_index", $nr_index);
    });

    $("#bt-form-salvar-cryptos").click(function () {
    
        const cryptos = Array.from(document.querySelectorAll('input[name="cryptos[]"]')).map(input => input.value);
        const prices = Array.from(document.querySelectorAll('input[name="prices[]"]')).map(input => input.value);
        const montantes = Array.from(document.querySelectorAll('input[name="montantes[]"]')).map(input => input.value);
        const corret = Array.from(document.querySelectorAll('input[name="corretoras[]"]')).map(input => input.value);
        const liquidp = Array.from(document.querySelectorAll('input[name="liquid_prices[]"]')).map(input => input.value);
        const alavanc = Array.from(document.querySelectorAll('input[name="alavancagens[]"]')).map(input => input.value);
        const currency = $("#form-crypto-select").val();

        const newUrl = `${window.location.origin}${window.location.pathname}?cryptos=${cryptos.join(',')}&prices=${prices.join(',')}&montantes=${montantes.join(',')}&corretoras=${corret.join(',')}&liquidprice=${liquidp.join(',')}&alavancagem=${alavanc.join(',')}&currency=${currency}`;
        //console.log('h', cryptos, prices, montantes, currency, newUrl);
        window.location.href = newUrl;
    });

    $("#botao_form_crypto").click(function(){
        open_form_new_crypto();
        $PERMISSAO_RELOAD = false;
    });

    $("#botao_refresh").click(function(){
        window.location.reload();
    });

    $(".btn-close").click(function(){
        $PERMISSAO_RELOAD = true;
    });


    fetchCryptoData();
    
    window.onload = autoReload;
});
