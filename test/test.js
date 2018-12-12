const expect = require('chai').expect;
const CALMAKER = require('../CALMAKER');


describe('methForTesting()', function() {
    it('should return sum of two numbers', function() {
        let num1 = 1;
        let num2 = 2;
        let sum = num1 + num2;
        expect(CALMAKER.methForTesting(1,2)).to.be.equal(sum);
    });
});

describe('methWithThisForTesting()', function() {
    it('should return 9', function() {
        expect(CALMAKER.methWithThisForTesting()).to.be.equal(9);
    });
});

describe('meth2WithThisForTesting()', function() {
    it('should return the num plus one', function() {
        let num = 9;
        expect(CALMAKER.meth2WithThisForTesting(num)).to.be.equal(num+1);
    });
});