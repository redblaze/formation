class Primitive { // interface
    excute(_, cb) {}
}

class SingleSelectionPrimitive extends Primitive {
    constructor(question, answers) {
        super();
        this._question = question;
        this._answers = answers;
    }

    execute(cachedAnswer, cb, contextEl) {
        let div = contextEl.find('.question_template').clone();
        div.removeClass('question_template').addClass('instance');
        div.show();
        contextEl.append(div);
        div.find('p').html(this._question);
        let foundSelect = false;
        let voidOption = div.find('.option_template');
        for (let i = 0; i < this._answers.length; i++) {
            let option = voidOption.clone();
            option.removeClass('option_template');
            option.attr('value', this._answers[i]);
            option.html(this._answers[i]);
            if (cachedAnswer && cachedAnswer.answer == this._answers[i]) {
                option.attr('selected', 'selected');
                foundSelect = true;
            }
            div.find('select').append(option);
        }
        if (foundSelect) {
            voidOption.remove();
        }
        div.change(function() {
            let val = div.find('select').val();
            cb({answer: val});
        });
    }
}

class NextPrimitive extends Primitive {
    isBreakPoint() {
        return true;
    }

    execute(_, cb, contextEl) {
        let div = contextEl.find('.next_template').clone();
        div.removeClass('next_template').addClass('instance');
        div.show();
        contextEl.append(div);
        div.on('click', function() {
            console.log('click next');
            cb();
        });
    }
}

class ThankYouPrimitive extends Primitive {
    constructor(text) {
        super();
        this._text = text;
    }

    execute(_, cb, contextEl) {
        let div = contextEl.find('.thankyou_template').clone();
        div.removeClass('thankyou_template').addClass('instance');
        div.show();
        contextEl.append(div);
        div.find('p').html(this._text);
        cb();
    }

    isFinish() {
        return true;
    }
}

class InputPrimitive extends Primitive {
    constructor(label) {
        super();
        this._label = label;
    }

    execute(cachedAnswer, cb, contextEl) {
        let div = contextEl.find('.input_template').clone();
        div.removeClass('input_template').addClass('instance');
        div.show();
        contextEl.append(div);
        div.find('p').html(this._label);
        let input = div.find('input');
        if (cachedAnswer) {
            input.val(cachedAnswer.answer);
        }
        input.change(function() {
            console.log(input);
            cb({answer: input.val()});
        });
    }
}
