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

// test cases not in test suite:
// 1. recurrence is infinite, starts before earlyfilterdate
// 1.1. recurrence is infinite, starts after latefilterdate
// 1.2. recurrence is infinite, starts within filter range

// 2. recurrence is limited, ends before earlyfilterdate
// 3. recurrence is limited, starts after latefilterdate
// 4. recurrence is limited, some occurance falls between earlyfilterdate and latefilterdate
// 5. no recurrance falls outside range
// 6. no recurrance falls inside ranbe

// perhaps our calMaker methods sort these and our test suite tests them as arrays.

// ultimately we need our calMaker to filter and concat these arrays.
// perhaps that is another round of tests... bifurcated by particular methods/functions

// seems like making this testable is a bit tricky
// meanwhile, believing in what I'm doing isn't tricky

// its a noom fantasy, I'm living in.