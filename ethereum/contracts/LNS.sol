// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import {Base64} from "./libraries/Base64.sol";
import {StringUtils} from "./libraries/StringUtils.sol";

error AlreadyRegistered();
error InvalidName(string name);
error Unauthorized();

contract LNS is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenId;
    string public tld;
    mapping(string => address) public domains;
    mapping(string => string) public records;
    mapping(uint256 => string) public names;
    string base =
        '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    address payable public admin;

    constructor(string memory _tld)
        payable
        ERC721("Lavish Name Service", "LNS")
    {
        tld = _tld;
        admin = payable(msg.sender);
    }

    function register(string calldata name) public payable {
        if (domains[name] != address(0)) revert AlreadyRegistered();
        if (!valid(name)) revert InvalidName(name);
        uint256 _price = price(name);
        require(msg.value >= _price, "Not enough MATIC paid");
        string memory domain = string(abi.encodePacked(name, ".", tld));
        string memory svg = string(
            abi.encodePacked(base, domain, "</text></svg>")
        );
        uint256 _tokenId = tokenId.current();
        uint256 len = StringUtils.strlen(name);
        string memory strLen = Strings.toString(len);
        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "',
                domain,
                '", "description": "a Lavish Name Service domain", "image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '","length":"',
                strLen,
                '"}'
            )
        );
        string memory tokenURI = string(
            abi.encodePacked("data:application/json;base64,", json)
        );
        console.log(
            "\n--------------------------------------------------------"
        );
        console.log(tokenURI);
        console.log(
            "--------------------------------------------------------\n"
        );
        _safeMint(msg.sender, _tokenId);
        _setTokenURI(_tokenId, tokenURI);
        domains[name] = msg.sender;
        names[_tokenId] = name;
        tokenId.increment();
    }

    function valid(string calldata name) public pure returns (bool) {
        return StringUtils.strlen(name) >= 3 && StringUtils.strlen(name) <= 10;
    }

    function price(string calldata name) public pure returns (uint256) {
        uint256 len = StringUtils.strlen(name);
        if (len == 3) {
            return 5 * 10**16;
        } else if (len == 4) {
            return 3 * 10**16;
        } else {
            return 1 * 10**16;
        }
    }

    function getAddress(string calldata name) public view returns (address) {
        return domains[name];
    }

    function getRecord(string calldata name)
        public
        view
        returns (string memory)
    {
        return records[name];
    }

    function setRecord(string calldata name, string calldata record) public {
        if (domains[name] != msg.sender) revert Unauthorized();
        records[name] = record;
    }

    function getAllNames() public view returns (string[] memory) {
        string[] memory allNames = new string[](tokenId.current());
        for (uint256 i = 0; i < tokenId.current(); i++) {
            allNames[i] = names[i];
        }
        return allNames;
    }

    modifier adminOnly() {
        require(isAdmin());
        _;
    }

    function isAdmin() public view returns (bool) {
        return msg.sender == admin;
    }

    function withdraw() public adminOnly {
        uint256 _balance = address(this).balance;
        (bool success, ) = msg.sender.call{value: _balance}("");
        require(success, "Failed to withdraw MATIC");
    }
}
