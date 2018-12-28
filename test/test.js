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
// hard with dates, because timezones and getting dates to numbers,
// using libraries that have no respect for the craft?
// better off using python utils? I don't understand what these people are thinking,
// but they must know better than me, right?

// 1. recurrence is infinite, starts before earlyfilterdate, true
// 1.1. recurrence is infinite, starts after latefilterdate, false
// 1.2. recurrence is infinite, starts within filter range, true

// 2. recurrence is limited, final before earlyfilterdate, false
// 3. recurrence is limited, starts after latefilterdate, false
// 4. recurrence is limited, some occurance falls within range, true
// 5. no recurrance falls before range, false
// 6 no recurrence falls within range, true
// 6.1 no recurrence falls after range, false

// check 6, 

// perhaps our calMaker methods sort these and our test suite tests them as arrays.

// ultimately we need our calMaker to filter and concat these arrays.
// perhaps that is another round of tests... bifurcated by particular methods/functions

// seems like making this testable is a bit tricky
// meanwhile, believing in what I'm doing isn't tricky

// is it a noob fantasy, I'm living in?