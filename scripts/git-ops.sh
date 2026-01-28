#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper to get current branch
get_current_branch() {
  git branch --show-current
}

echo -e "${BLUE}=== Symbria Git Helper ===${NC}"
echo "1. Save & Push (git add . + commit + push)"
echo "2. Create New Branch (git checkout -b)"
echo "3. Exit"
echo ""
read -p "Select an option [1-3]: " option

case $option in
    1)
        # --- SAVE & PUSH ---
        echo ""
        echo -e "${YELLOW}Stage 1: Git Add .${NC}"
        git add .
        
        echo ""
        read -p "Enter commit message: " msg
        if [ -z "$msg" ]; then
            echo -e "${RED}Commit message required. Aborting.${NC}"
            exit 1
        fi

        read -p "Enter optional description (press enter to skip): " desc
        
        echo ""
        echo -e "${YELLOW}Stage 2: Git Commit${NC}"
        if [ -z "$desc" ]; then
            git commit -m "$msg"
        else
            git commit -m "$msg" -m "$desc"
        fi

        current_branch=$(get_current_branch)
        echo ""
        echo -e "${YELLOW}Stage 3: Git Push origin $current_branch${NC}"
        git push origin "$current_branch"
        
        echo ""
        echo -e "${GREEN}Success! Changes pushed to $current_branch.${NC}"
        ;;
    
    2)
        # --- NEW BRANCH ---
        echo ""
        read -p "Enter new branch name: " branch_name
        if [ -z "$branch_name" ]; then
            echo "Branch name required."
            exit 1
        fi
        
        git checkout -b "$branch_name"
        echo ""
        echo -e "${GREEN}Switched to new branch: $branch_name${NC}"
        ;;
        
    *)
        echo "Exiting."
        exit 0
        ;;
esac
