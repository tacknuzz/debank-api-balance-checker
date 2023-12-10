# Debank Balance Checker for Ethereum & EVM Chains
Check Ethereum and 67 other EVM chain balances of wallet addresses using debank API. Multithreaded and super fast. Supports address, private key, mnemonic checks. Debank is the best inclusive solution.

### Features
- Check balances across multiple EVM chains.
- Support for Ethereum, BSC, Arbitrum, Polygon, xDai, zkSync, zkEVM, Linea, Optimism, Avalanche, and more(67+ in total)
- Input from addresses, private keys, or mnemonics. Resolves automatically.
- Proxy support for rate limit handling.
- Concurrency control for speed & efficient processing.

### Prerequisites
**Node.js**: The application is built with Node.js. You must have Node.js installed to run this tool. Download and install it from [Node.js official website](https://nodejs.org/en/download/).


### Installation
1. Clone the repository (or directly download and extract manually):
```bash
git clone https://github.com/tacknuzz/debank-api-balance-checker.git
```

2. Navigate to the project directory:
```bash
cd debank-api-balance-checker
```

3. Install dependencies (or use yarn):
```bash
npm install
```

### Usage
1. Prepare your input file with wallet addresses, private keys, or mnemonics.
2. Run the script:
```bash
node index.js -i path/to/input.txt -o path/to/output.csv -c 5
```
  - `-i`: Input file path.
  - `-o`: Output file path.
  - `-c`: (Optional) Concurrency limit.

### Configuration
**Proxies**: Place your proxy list in `proxies.txt` in the project root.
**API**: The tool uses the DeBank API. No additional configuration is required.

### Contributing
Contributions, issues, and feature requests are welcome! Feel free to check issues page.

### License
Distributed under the MIT License. See `LICENSE` for more information.

### Tips:
`0xAceBabe64807cb045505b268ef253D8fC2FeF5Bc`
