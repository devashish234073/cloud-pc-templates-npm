export class VectorDB {
    logger = new Logger("VectorDB");
    host;
    PORT = 4302;
    constructor(host = "http://localhost") {
        this.host = host;   
    }

}