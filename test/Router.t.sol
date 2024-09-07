// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Wrap} from "../src/Router.sol";


contract FuckEtherTest is Test {
    function setUp() external {
        vm.createSelectFork("https://eth.llamarpc.com");
    }

    function testHi() external {
        Wrap hi = Wrap(payable(0x078609EFFd0A4E1c5dFAe0F03A614d2175450EF4));
        // hi.initialize{value: 10}();

        hi.buy{value: 0.0131816125064777 ether}(address(0xF1a732FEEEb43450E4B35b54ea9D04eD994391AA), 1000000, block.timestamp);

        hi.buy{value: 0.0131816125064777 ether}(address(0xF1a732FEEEb43450E4B35b54ea9D04eD994391AA), 1000000, block.timestamp);
        // hi.fuckethervista{value: 888 wei}(1000000);
    }

    fallback() external payable {}
}
