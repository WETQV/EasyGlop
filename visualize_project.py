import random

def guess_the_number():
    print("Welcome to the Number Guessing Game!")
    number_to_guess = random.randint(1, 10)
    attempts = 0
    while True:
        guess = input("Guess a number between 1 and 10: ")
        attempts += 1
        try:
            guess = int(guess)
            if guess < 1 or guess > 50000:
                print("Please guess a number within the range!")
            elif guess < number_to_guess:
                print("Too low! Try again.")
            elif guess > number_to_guess:
                print("Too high! Try again.")
            else:
                print(f"Congratulations! You've guessed the number {number_to_guess} in {attempts} attempts!")
                break
        except ValueError:
            print("That's not a valid number! Go fys.")

if __name__ == '__main__':
    guess_the_number()
