"use client";

import { useState } from 'react';
import { type GenerateQuizOutput, type QuizQuestion as QuizQuestionType } from '@/ai/flows/generate-quiz';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuizView({ quiz }: { quiz: GenerateQuizOutput }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(quiz.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  if (showResults) {
    const score = selectedAnswers.reduce((acc, selected, index) => {
        return selected === quiz.questions[index].answer ? acc + 1 : acc;
    }, 0);

    return <QuizScore quiz={quiz} selectedAnswers={selectedAnswers} score={score} />;
  }

  return (
    <Card className="max-w-xl w-full mx-auto bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>{quiz.title}</CardTitle>
        <Progress value={(currentQuestionIndex / quiz.questions.length) * 100} className="mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
      </CardHeader>
      <CardContent>
        <Question 
          question={quiz.questions[currentQuestionIndex]} 
          onAnswerSelect={handleAnswerSelect}
          selectedAnswer={selectedAnswers[currentQuestionIndex]}
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline">
          Previous
        </Button>
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={selectedAnswers[currentQuestionIndex] === null}>
            Submit
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function Question({ question, onAnswerSelect, selectedAnswer }: { question: QuizQuestionType, onAnswerSelect: (index: number) => void, selectedAnswer: number | null }) {
  return (
    <div>
      <p className="font-semibold mb-4">{question.question}</p>
      <RadioGroup onValueChange={(value) => onAnswerSelect(parseInt(value))} value={selectedAnswer?.toString()}>
        {question.options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50">
            <RadioGroupItem value={index.toString()} id={`q${question.question}-opt${index}`} />
            <Label htmlFor={`q${question.question}-opt${index}`} className="flex-1 cursor-pointer">{option}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

function QuizScore({ quiz, selectedAnswers, score }: { quiz: GenerateQuizOutput, selectedAnswers: (number|null)[], score: number }) {
    return (
        <Card className="max-w-xl w-full mx-auto bg-card/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle>Quiz Results: {quiz.title}</CardTitle>
                <CardDescription>You scored {score} out of {quiz.questions.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {quiz.questions.map((question, index) => {
                    const selected = selectedAnswers[index];
                    const isCorrect = selected === question.answer;

                    return (
                        <div key={index}>
                            <h4 className="font-semibold">{index + 1}. {question.question}</h4>
                            <div className="mt-2 space-y-2">
                                {question.options.map((option, optionIndex) => {
                                    const isSelected = selected === optionIndex;
                                    const isCorrectAnswer = question.answer === optionIndex;

                                    return (
                                        <div 
                                            key={optionIndex}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-md border",
                                                isCorrectAnswer ? "bg-green-500/10 border-green-500/30" : "",
                                                isSelected && !isCorrectAnswer ? "bg-red-500/10 border-red-500/30" : ""
                                            )}
                                        >
                                            {isCorrectAnswer ? <CheckCircle className="h-5 w-5 text-green-500" /> : (isSelected ? <XCircle className="h-5 w-5 text-red-500" /> : <div className="h-5 w-5" />)}
                                            <span className={cn(isCorrectAnswer && "font-bold")}>{option}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-sm text-muted-foreground mt-2"><span className="font-semibold">Explanation:</span> {question.explanation}</p>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
    )
}
