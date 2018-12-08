const expect = require('chai').expect;
// const CALMAKER = require('../calMaker').CALMAKER;
const CALMAKER = require('../calMaker');


describe('methForTesting()', function() {
    it('should return sum of two numbers', function() {
        let num1 = 1;
        let num2 = 2;
        let sum = num1 + num2;
        expect(CALMAKER.methodForTesting(1,2)).to.be.equal(sum);
    });
});