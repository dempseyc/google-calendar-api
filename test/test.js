const expect = require('chai').expect;
const CALMAKER = require('../CALMAKER');


describe('funcForTesting()', function() {
    it('should return sum of two numbers', function() {
        let num1 = 1;
        let num2 = 2;
        let sum = num1 + num2;
        expect(CALMAKER.funcForTesting(1,2)).to.be.equal(sum);
    });
});

describe('funcWithThisForTesting()', function() {
    it('should return the num passed in', function() {
        let num = 9;
        expect(CALMAKER.funcWithThisForTesting(num)).to.be.equal(num);
    });
});