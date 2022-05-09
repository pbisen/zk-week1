#!/bin/bash

# [assignment] create your own bash script to compile Multipler3.circom using PLONK below


cd ../contracts/circuits

mkdir Multiplier3_plonk

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling Multiplier3.circom..."

# compile circuit


circom Multiplier3.circom --r1cs --wasm --sym -o Multiplier3_plonk
snarkjs r1cs info ./Multiplier3_plonk/Multiplier3.r1cs

snarkjs r1cs export json ./Multiplier3_plonk/Multiplier3.r1cs ./Multiplier3_plonk/Multiplier3.r1cs.json


# Start a new zkey and make a contribution

snarkjs pks Multiplier3_plonk/Multiplier3.r1cs powersOfTau28_hez_final_10.ptau Multiplier3_plonk/circuit_final.zkey
node ./Multiplier3_plonk/Multiplier3_js/generate_witness.js ./Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm ./input_plonk.json ./Multiplier3_plonk/witness.wtns 
snarkjs pkp Multiplier3_plonk/circuit_final.zkey Multiplier3_plonk/witness.wtns Multiplier3_plonk/proof.json Multiplier3_plonk/public.json
snarkjs zkey export verificationkey ./Multiplier3_plonk/circuit_final.zkey ./Multiplier3_plonk/verification_key.json
# snarkjs pks Multiplier3_plonk/Multiplier3.r1cs ./Multiplier3_plonk/witness.wtns ./Multiplier3_plonk/proof.json ./Multiplier3_plonk/public.json
snarkjs pkv ./Multiplier3_plonk/verification_key.json Multiplier3_plonk/public.json Multiplier3_plonk/proof.json

# generate solidity contract
snarkjs zkey export solidityverifier Multiplier3_plonk/circuit_final.zkey ../Multiplier3_plonkVerifier.sol

cd ../..