import click
from pathlib import Path
from gitignore_parser import parse_gitignore

# Функция для построения дерева проекта
def build_tree(path, ignore_func, prefix="", is_last=True, depth=0, max_depth=3):
    tree = []
    items = sorted([item for item in path.iterdir() if not ignore_func(item)])  # Фильтруем и сортируем
    for index, item in enumerate(items):
        is_last_item = index == len(items) - 1
        connector = "└── " if is_last_item else "├── "
        
        # Проверяем глубину
        if depth >= max_depth and item.is_dir():
            tree.append(f"{prefix}{connector}{item.name}/... (глубже не показываем)")
            continue

        if item.is_dir():
            tree.append(f"{prefix}{connector}{item.name}/")
            new_prefix = prefix + ("    " if is_last_item else "│   ")
            tree.extend(build_tree(item, ignore_func, new_prefix, is_last_item, depth + 1, max_depth))
        else:
            tree.append(f"{prefix}{connector}{item.name}")
    return tree

# Функция для чтения .gitignore
def read_gitignore(gitignore_path):
    if gitignore_path.exists():
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
        return lines
    return []

# Расширенная функция игнорирования
def enhanced_ignore(ignore_func, path):
    # Всегда игнорируем .git
    if path.name == '.git':
        return True
    # Применяем правила из .gitignore
    return ignore_func(path)

# Основная команда
@click.command()
@click.argument('project_path', type=click.Path(exists=True), required=False)
@click.option('--max-depth', default=3, help='Максимальная глубина отображения дерева.')
def visualize_project(project_path, max_depth):
    # Если путь не указан, берём текущую директорию
    if project_path is None:
        project_path = Path.cwd()
        click.echo(f"Используем текущую директорию: {project_path}")
    else:
        project_path = Path(project_path)

    # Проверяем наличие .gitignore
    gitignore_path = project_path / '.gitignore'
    if gitignore_path.exists():
        base_ignore_func = parse_gitignore(gitignore_path)
        gitignore_content = read_gitignore(gitignore_path)
    else:
        base_ignore_func = lambda path: False
        gitignore_content = []

    # Создаём расширенную функцию игнорирования
    ignore_func = lambda path: enhanced_ignore(base_ignore_func, path)

    # Выводим содержимое .gitignore
    if gitignore_content:
        click.echo("\nСодержимое .gitignore:")
        click.echo("---------------------")
        for line in gitignore_content:
            click.echo(f"  {line}")
        click.echo("---------------------\n")
    else:
        click.echo("\nФайл .gitignore не найден.\n")

    # Строим и выводим дерево проекта
    click.echo(f"Структура проекта ({project_path.name}) с максимальной глубиной {max_depth}:")
    tree = build_tree(project_path, ignore_func, max_depth=max_depth)
    for line in tree:
        print(line)

if __name__ == '__main__':
    visualize_project()


#python visualize_project.py --max-depth 5