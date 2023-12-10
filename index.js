const axios = require('axios');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { program } = require('commander');
const { ethers } = require('ethers');
const colors = require('colors');
const pAll = require('p-all');
const prompt = require('prompt-sync')();

program
    .requiredOption('-i, --input <file>', 'Input file for wallets')
    .requiredOption('-o, --output <file>', 'Output file for balance results')
    .option('-c, --concurrency <number>', 'Concurrency', 1)
    .parse(process.argv);

const options = program.opts();

const proxies = fs
    .readFileSync('./proxies.txt', 'utf-8')
    .split('\n')
    .filter((p) => !!p);

const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

async function getUsedChains(address) {
    const randomProxyIndex = getRandomInt(0, proxies.length - 1);
    const randomProxy = proxies[randomProxyIndex];

    const httpsAgent = new HttpsProxyAgent(randomProxy);

    try {
        const url = `https://api.debank.com/user/used_chains?id=${address}`;
        const headers = {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9',
            // Include other headers as required
        };

        let response;
        let tries = 0;

        while (tries < 3) {
            try {
                response = await axios.get(url, {
                    httpsAgent,
                    headers,
                });
                break; // Break the loop if the request is successful
            } catch (error) {
                // console.error('Error fetching used chains:', address);
                tries++;
            }
        }

        if (response) {
            const usedChains = response.data.data.chains;
            return usedChains;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error fetching used chains:', address);
        return [];
    }
}

async function getWalletUsdValueForChain(address, chain) {
    const randomProxyIndex = getRandomInt(0, proxies.length - 1);
    const randomProxy = proxies[randomProxyIndex];

    const httpsAgent = new HttpsProxyAgent(randomProxy);

    try {
        const url = `https://api.debank.com/token/balance_list?is_all=false&user_addr=${address}&chain=${chain}`;
        const headers = {
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.5',
            // ... other headers as required
        };

        let response;
        let tries = 0;

        while (tries < 3) {
            try {
                response = await axios.get(url, {
                    httpsAgent,
                    headers,
                });
                break; // Break the loop if the request is successful
            } catch (error) {
                // console.error('Error fetching wallet USD value for chain:', chain);
                tries++;
            }
        }

        if (response) {
            const usdValue = response.data.data.reduce(
                (a, b) => a + b.amount * b.price,
                0
            );
            return usdValue;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error fetching wallet USD value for chain:', chain);
        return null;
    }
}

async function getWalletUsdValue(address) {
    const chains = await getUsedChains(address);
    const actions = [];

    chains.forEach((chain) => {
        actions.push(async () => {
            return await getWalletUsdValueForChain(address, chain);
        });
    });

    return await pAll(actions, { concurrency: 3 }).then((values) => {
        const usdValue = values.reduce((a, b) => a + b, 0);

        return usdValue;
    });
}

async function processWallets(inputFile, outputFile) {
    console.log('Procesing file:'.yellow, inputFile);
    try {
        const inputContent = fs.readFileSync(inputFile, 'utf-8');
        const lines = inputContent
            .split('\n')
            .filter((line) => line.trim() !== '')
            .filter(String);

        const firstLine = lines[0];

        if (ethers.utils.isAddress(firstLine)) {
            await processAddresses(lines);
        } else if (ethers.utils.isHexString(firstLine)) {
            await processPrivateKeys(lines);
        } else {
            var n = prompt(
                'How many address you want to generate per mnemonic?: '
            );

            await processMnemonics(lines, parseInt(n));
        }
    } catch (error) {
        console.error('Error processing wallets:', error);
    }
}

async function processAddresses(wallets) {
    const actions = [];
    for (let i = 0; i < wallets.length; i++) {
        const address = wallets[i];

        actions.push(async () => {
            try {
                const balance = await getWalletUsdValue(address);

                if (balance > 0) {
                    console.log(
                        address,
                        `$${parseFloat(balance).toFixed(2)}`.green
                    );
                } else {
                    console.log(address, `$${balance}`.gray);
                }

                fs.appendFileSync(
                    options.output,
                    `${address},${balance}\n`,
                    'utf-8'
                );
            } catch (error) {
                console.error(
                    'Error fetching wallet USD value address:',
                    address
                );
                // console.error(error);
            }
        });
    }
    await pAll(actions, { concurrency: parseInt(options.concurrency) });
}

async function processPrivateKeys(privateKeys) {
    const actions = [];
    for (let i = 0; i < privateKeys.length; i++) {
        const privateKey = privateKeys[i];

        actions.push(async () => {
            try {
                const wallet = new ethers.Wallet(privateKey);
                const balance = await getWalletUsdValue(wallet.address);

                if (balance > 0) {
                    console.log(
                        wallet.address,
                        `$${parseFloat(balance).toFixed(2)}`.green
                    );
                } else {
                    console.log(wallet.address, `$${balance}`.gray);
                }

                fs.appendFileSync(
                    options.output,
                    `${wallet.privateKey},${wallet.address},${balance}\n`,
                    'utf-8'
                );
            } catch (error) {
                console.error(
                    'Error fetching wallet USD value for private key:',
                    privateKey
                );
                // console.error(error);
            }
        });
    }
    await pAll(actions, { concurrency: parseInt(options.concurrency) });
}

async function processMnemonics(mnemonics, n) {
    const actions = [];

    for (let i = 0; i < mnemonics.length; i++) {
        const mnemonic = mnemonics[0];

        // generate n number of addresses from mnemonic
        for (let j = 0; j < n; j++) {
            actions.push(async () => {
                try {
                    const wallet = ethers.Wallet.fromMnemonic(
                        mnemonic,
                        `m/44'/60'/0'/0/${j}`
                    );

                    const balance = await getWalletUsdValue(wallet.address);
                    if (balance > 0) {
                        console.log(
                            wallet.address,
                            `$${parseFloat(balance).toFixed(2)}`.green
                        );
                    } else {
                        console.log(wallet.address, `$${balance}`.gray);
                    }
                    fs.appendFileSync(
                        options.output,
                        `${wallet.privateKey},${wallet.address},${balance}\n`,
                        'utf-8'
                    );
                } catch (error) {
                    console.error(
                        'Error fetching wallet USD value for mnemonic:',
                        mnemonic
                    );
                    // console.error(error);
                }
            });
        }
    }
    await pAll(actions, { concurrency: parseInt(options.concurrency) });
}

processWallets(options.input, options.output);
