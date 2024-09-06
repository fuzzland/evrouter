// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {FakeToken} from "../src/Counter.sol";


contract FuckEtherTest is Test {
    function setUp() external {
        vm.createSelectFork("http://64.71.166.16/eth-chain", 20687130);
    }

    function testHi() external {
        FakeToken hi = new FakeToken();
        hi.initialize{value: 1 ether}();

        hi.buy{value: 1 ether}(address(0x6aF84e3e9Fa8486b5cBb67c55ED1E7D9372a6d23), 1000000);
        // hi.fuckethervista{value: 888 wei}(1000000);
    }
}