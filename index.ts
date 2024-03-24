import * as crypto from 'crypto';

class Transaction {
  constructor(
    public amount: number,
    public payer: string, // public key
    public payee: string // public key
  ) {}

  toString() {
    return JSON.stringify(this);
  }
}

class Block {
  constructor(
    public prevHash: string | null,
    public transaction: Transaction,
    public ts = Date.now()
  ) {}

  get hash() {
    const str = JSON.stringify(this);
    const hash = crypto.createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}

class Chain {
  public static instance = new Chain();
  chain: Block[];

  constructor() {
    this.chain = [this.genesisBlock()];
  }

  private genesisBlock(): Block {
    return new Block(null, new Transaction(100, 'genesis', 'Rabi'));
  }

  get lastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(
    transaction: Transaction,
    senderPublicKey: string,
    signature: Buffer
  ) {
    const verifier = crypto.createVerify('SHA256');
    verifier.update(transaction.toString());

    const isValid = verifier.verify(transaction.payee, signature);

    if (isValid) {
      const newBlock = new Block(this.lastBlock.hash, transaction);
      this.chain.push(newBlock);
    } else {
      console.log('Invalid transaction. Block not added to the chain.');
    }
  }
}

class Wallet {
  public privateKey: string;
  public publicKey: string;

  constructor() {
    const keypair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey);
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

const Rabi = new Wallet();
const Javed = new Wallet();
const Asad = new Wallet();

Rabi.sendMoney(50, Javed.publicKey);
Asad.sendMoney(100, Rabi.publicKey);
Javed.sendMoney(500, Rabi.publicKey);

console.log(Chain.instance);
