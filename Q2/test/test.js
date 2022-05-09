const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "../contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","../contracts/circuits/HelloWorld/circuit_final.zkey");  //creates a proof and the public outputs using groth16

        console.log('1x2 =',publicSignals[0]);  //reads the output in publicSignals

        const editedPublicSignals = unstringifyBigInts(publicSignals);  //the outputs in publicSignals are strings, to make working with them easier they are converted to bigint
        const editedProof = unstringifyBigInts(proof);  //same for proof
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);    //simulates a verification call
    
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());   //parses through the calldata to extract just the integer data to create an array
    
        const a = [argv[0], argv[1]];   //combines first and second array element
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]]; //combines 3rd 4th and 5th 6th elements
        const c = [argv[6], argv[7]];   //combines 7th and 8th element
        const Input = argv.slice(8);    //copies the rest of the data after the 8 elements

        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;  //verifies the proof using the input elements
    });
    it("Should return false for invalid proof", async function () {
        //creates fake input parameters
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false; //verifies proof using the fake input parameters
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2", "c":"3"}, "../contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","../contracts/circuits/Multiplier3/circuit_final.zkey");  //creates a proof and the public outputs using groth16

        console.log('1x2x3 =',publicSignals[0]);  //reads the output in publicSignals

        const editedPublicSignals = unstringifyBigInts(publicSignals);  //the outputs in publicSignals are strings, to make working with them easier they are converted to bigint
        const editedProof = unstringifyBigInts(proof);  //same for proof
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);    //simulates a verification call


        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());   //parses through the calldata to extract just the integer data to create an array
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];
        const Input = argv.slice(8);
        const data = {a,b,c};
        var mainbytesArray = [];
        for(var i = 0; i < data.length; i++){
            var bytes = [];
            for (var j = 0; j < data[i].length; ++j)       
                bytes.push(data[i].charCodeAt(j));
            mainbytesArray.push(bytes);
        }
        // console.log(editedProof);

        expect(await verifier.verifyProof(a,b,c, Input)).to.be.true;  //verifies the proof using the input elements
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false; 
    });
});


describe("Multiplier3 with PLONK", function () {
    let verifier, Verifier;

    beforeEach(async function () {
        //[assignment] insert your script here
        Verifier = await ethers.getContractFactory("Multiplier3_plonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] insert your script here
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2", "c":"3"}, "../contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","../contracts/circuits/Multiplier3_plonk/circuit_final.zkey");  //creates a proof and the public outputs using groth16

        console.log('1x2x3 =',publicSignals[0]);  //reads the output in publicSignals
        const editedPublicSignals = unstringifyBigInts(publicSignals);  //the outputs in publicSignals are strings, to make working with them easier they are converted to bigint
        const editedProof = unstringifyBigInts(proof);  //same for proof
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);
        var calls = calldata.split(',');

        expect(await verifier.verifyProof(calls[0], JSON.parse(calls[1]))).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        //[assignment] insert your script here
        let a = '0x00';
        let b = ['0'];
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});